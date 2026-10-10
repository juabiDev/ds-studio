import "server-only";

// Better Auth rate-limits requests to its HTTP endpoints, but server actions call auth.api.*
// directly and skip that limiter, so the admin login applies its own. In-memory per server
// instance, like Better Auth's default storage: fine for a single Railway instance.

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const MAX_KEYS = 10_000;

const attempts = new Map<string, number[]>();

/**
 * True when any key already used its MAX_ATTEMPTS in the window; otherwise records the attempt for
 * every key. Rejected attempts aren't recorded, so retrying while locked out doesn't extend the
 * lockout: it lifts one window after the last allowed attempt.
 */
export const isLoginRateLimited = (keys: string[], now = Date.now()) => {
  const recentByKey = keys.map((key) => [key, (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS)] as const);
  const limited = recentByKey.some(([, recent]) => recent.length >= MAX_ATTEMPTS);

  for (const [key, recent] of recentByKey) {
    if (!limited) recent.push(now);
    attempts.set(key, recent);
  }

  // Keep memory bounded: drop idle keys, then the oldest ones (Map keeps insertion order)
  if (attempts.size > MAX_KEYS) {
    for (const [key, times] of attempts) if (times.every((t) => now - t >= WINDOW_MS)) attempts.delete(key);
    for (const key of attempts.keys()) {
      if (attempts.size <= MAX_KEYS) break;
      attempts.delete(key);
    }
  }

  return limited;
};
