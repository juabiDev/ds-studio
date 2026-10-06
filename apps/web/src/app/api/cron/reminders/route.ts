import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { sendTodayReminderEmails } from "@ds-studio/messaging/email";

export const dynamic = "force-dynamic";
// Sending is throttled to stay under Resend's rate limit, so a busy day takes a while
export const maxDuration = 300;

/** Hashing first gives equal-length buffers, so the comparison is constant-time for any input. */
const secretsMatch = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

/**
 * Daily same-day reminder emails, triggered at 08:00 (Montevideo) by the Railway cron service
 * (scripts/send-reminders.mjs). Requires `Authorization: Bearer <CRON_SECRET>`.
 */
const handler = async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  // Without a secret the endpoint doesn't exist, so it can never be triggered by accident
  if (!secret) return new NextResponse(null, { status: 404 });

  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secretsMatch(given, secret)) return new NextResponse(null, { status: 401 });

  try {
    const summary = await sendTodayReminderEmails();
    console.info("[cron/reminders]", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[cron/reminders]", error);
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 });
  }
};

export const GET = handler;
export const POST = handler;
