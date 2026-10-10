import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { bearerAuthFailure } from "@/lib/bearer-auth";

export const dynamic = "force-dynamic";

/** Every cached page that shows admin-edited content (services, barbers, gallery, FAQ, settings). */
const CACHED_PAGES = ["/", "/privacidad", "/terminos"];

/**
 * Called by the admin after each save, so edits show up right away instead of when the 5-minute
 * cache expires. Requires `Authorization: Bearer <REVALIDATE_SECRET>` (same value in web and admin).
 */
export const POST = (request: NextRequest) => {
  const failure = bearerAuthFailure(request, process.env.REVALIDATE_SECRET);
  if (failure) return new NextResponse(null, { status: failure });

  for (const path of CACHED_PAGES) revalidatePath(path);
  return NextResponse.json({ revalidated: CACHED_PAGES });
};
