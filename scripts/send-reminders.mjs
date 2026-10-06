// Start command of the Railway cron service (schedule "0 11 * * *" = 08:00 in Montevideo, UTC-3).
// It only calls the web app, which does the actual work; exits non-zero so Railway marks failed runs.
// Needs NEXT_PUBLIC_SITE_URL and CRON_SECRET (same value as in the web service).

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const secret = process.env.CRON_SECRET;

if (!siteUrl || !secret) {
  console.error("NEXT_PUBLIC_SITE_URL and CRON_SECRET are required");
  process.exit(1);
}

const res = await fetch(new URL("/api/cron/reminders", siteUrl), {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(5 * 60_000),
});

const body = await res.text();
console.log(`[send-reminders] ${res.status} ${body}`);
process.exit(res.ok ? 0 : 1);
