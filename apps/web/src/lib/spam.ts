import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { prisma } from "@ds-studio/database";

/** Successful online bookings allowed per IP per hour; real customers book once. */
const MAX_BOOKINGS_PER_IP_PER_HOUR = 3;

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const getClientIp = async () => {
  const h = await headers();
  // First hop is the client when behind Vercel/Railway/Cloudflare proxies
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
};

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

export const isTurnstileEnabled = () => !!process.env.TURNSTILE_SECRET_KEY;

/** Cloudflare Turnstile bot check. Skipped (passes) until TURNSTILE_SECRET_KEY is configured. */
export const verifyTurnstile = async (token: string | undefined, ip: string | null) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
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
