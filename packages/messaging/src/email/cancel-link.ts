import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { dateKeyToDbDate, shopNowMinutes, timeToMinutes, toShopDateKey } from "@ds-studio/database/dates";

import { getPublicSiteUrl } from "../config";

/** Customers can cancel from the email link until this long before the appointment. */
export const ONLINE_CANCEL_CUTOFF_MINUTES = 120;

const MINUTES_PER_DAY = 24 * 60;

/** Minutes from now (shop time) until the appointment starts; negative once it has started. */
export const minutesUntil = (dateKey: string, time: string) => {
  const days = (dateKeyToDbDate(dateKey).getTime() - dateKeyToDbDate(toShopDateKey()).getTime()) / 86_400_000;
  return days * MINUTES_PER_DAY + timeToMinutes(time) - shopNowMinutes();
};

export const isWithinCancelWindow = (dateKey: string, time: string) =>
  minutesUntil(dateKey, time) >= ONLINE_CANCEL_CUTOFF_MINUTES;

const getLinkSecret = () => process.env.BOOKING_LINK_SECRET || null;

const sign = (secret: string, appointmentId: string) =>
  createHmac("sha256", secret).update(`cancel:${appointmentId}`).digest().subarray(0, 16).toString("base64url");

/**
 * The link is the appointment id plus an HMAC of it, so every email (confirmation now, reminder
 * later) can carry the same link without storing a token. Null when BOOKING_LINK_SECRET or the
 * public site URL is unset.
 */
export const buildCancelUrl = (appointmentId: string) => {
  const secret = getLinkSecret();
  const siteUrl = getPublicSiteUrl();
  if (!secret || !siteUrl) return null;

  const url = new URL(`/cancelar-turno/${appointmentId}`, siteUrl);
  url.searchParams.set("t", sign(secret, appointmentId));
  return url.toString();
};

export const isValidCancelToken = (appointmentId: string, token: string) => {
  const secret = getLinkSecret();
  if (!secret) return false;

  const expected = Buffer.from(sign(secret, appointmentId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
};
