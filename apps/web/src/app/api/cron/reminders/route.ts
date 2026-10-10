import { NextResponse, type NextRequest } from "next/server";

import { sendTodayReminderEmails } from "@ds-studio/messaging/email";

import { cronAuthFailure } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
// Sending is throttled to stay under Resend's rate limit, so a busy day takes a while
export const maxDuration = 300;

/** Daily same-day reminder emails, triggered at 08:00 (Montevideo) by the Railway cron service (scripts/send-reminders.mjs). */
const handler = async (request: NextRequest) => {
  const failure = cronAuthFailure(request);
  if (failure) return new NextResponse(null, { status: failure });

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
