import "server-only";

/**
 * Asks the public site to re-render its cached pages now (POST /api/revalidate), so admin edits
 * show up right away. Never throws: if it fails or isn't configured, the site still refreshes on
 * its own within 5 minutes. Call it with after() so the admin never waits on it.
 */
export const refreshPublicSite = async () => {
  const secret = process.env.REVALIDATE_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !siteUrl) {
    console.warn("[refreshPublicSite] REVALIDATE_SECRET or NEXT_PUBLIC_SITE_URL missing; the site updates within 5 minutes");
    return;
  }

  try {
    const res = await fetch(new URL("/api/revalidate", siteUrl), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) console.error("[refreshPublicSite] public site answered", res.status);
  } catch (error) {
    console.error("[refreshPublicSite]", error);
  }
};
