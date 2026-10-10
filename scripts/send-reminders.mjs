// Start command of the Railway cron service (schedule "0 11 * * *" = 08:00 in Montevideo, UTC-3).
// It only calls the web app, which does the actual work: the same-day reminder emails, then the
// anonymization of old customer data. Exits non-zero when any job fails so Railway marks the run.
// Needs NEXT_PUBLIC_SITE_URL and CRON_SECRET (same value as in the web service).

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const secret = process.env.CRON_SECRET;

if (!siteUrl || !secret) {
  console.error("NEXT_PUBLIC_SITE_URL and CRON_SECRET are required");
  process.exit(1);
}

const JOBS = ["/api/cron/reminders", "/api/cron/retention"];

let failed = false;

// One after the other: each job is independent, so a failed one doesn't stop the next
for (const path of JOBS) {
  try {
    const res = await fetch(new URL(path, siteUrl), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5 * 60_000),
    });
    console.log(`[cron] ${path} ${res.status} ${await res.text()}`);
    if (!res.ok) failed = true;
  } catch (error) {
    console.error(`[cron] ${path} failed`, error);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
