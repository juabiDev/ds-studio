import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@ds-studio/auth/server";

export const POST = async (request: NextRequest) => {
  // Deletes the database session; the nextCookies plugin clears the cookie on this response
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined);

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
};
