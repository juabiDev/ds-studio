import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { prisma } from "@ds-studio/database";
import { getClientIpFromHeaders } from "@ds-studio/database/client-ip";

/** Successful online bookings allowed per IP per hour; real customers book once. */
const MAX_BOOKINGS_PER_IP_PER_HOUR = 3;

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const getClientIp = async () => getClientIpFromHeaders(await headers());

/** Salted hash so raw IPs are never stored. */
const hashIp = (ip: string) =>
  createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex");

export const getClientContext = async () => {
  const ip = await getClientIp();
  return { ip, ipHash: ip ? hashIp(ip) : null };
};

export const isIpRateLimited = async (ipHash: string | null) => {
  if (!ipHash) return false;

  const recent = await prisma.appointment.count({
    where: {
      clientIpHash: ipHash,
      source: "ONLINE",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  return recent >= MAX_BOOKINGS_PER_IP_PER_HOUR;
};

/**
 * Cloudflare Turnstile bot check. Skipped (passes) until TURNSTILE_SECRET_KEY is set, so a missing
 * key never takes online booking down; the honeypot and the per-IP limit still apply. Production
 * logs an error on every booking so the gap gets noticed.
 */
export const verifyTurnstile = async (token: string | undefined, ip: string | null) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") console.error("[turnstile] TURNSTILE_SECRET_KEY is not set; bot check skipped");
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[turnstile]", error);
    return false;
  }
};
