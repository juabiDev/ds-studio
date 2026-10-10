import "server-only";

// In-memory sliding window per server instance: fine for a single Railway instance, and only
// meant to stop scripted floods, not to be exact.

const MAX_KEYS = 10_000;

interface RateLimiter {
  /** True when `key` already used its quota in the current window; otherwise records the hit. */
  isLimited: (key: string) => boolean;
}

export const createRateLimiter = ({ windowMs, max }: { windowMs: number; max: number }): RateLimiter => {
  const hits = new Map<string, number[]>();

  return {
    isLimited: (key) => {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      // Rejected requests aren't recorded, so a client that keeps retrying recovers once the window passes
      const limited = recent.length >= max;
      if (!limited) recent.push(now);
      hits.set(key, recent);

      // Keep memory bounded: drop idle keys, then the oldest ones (Map keeps insertion order)
      if (hits.size > MAX_KEYS) {
        for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        for (const k of hits.keys()) {
          if (hits.size <= MAX_KEYS) break;
          hits.delete(k);
        }
      }

      return limited;
    },
  };
};
