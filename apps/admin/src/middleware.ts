import { NextResponse, type NextRequest } from "next/server";

import { hasSessionCookie } from "@ds-studio/auth/middleware";

const PUBLIC_PATHS = ["/login", "/api/auth"];

// Fast cookie check before rendering. The session itself and the ADMIN role are verified by
// requireAdmin() in the dashboard layout and in every server action.
export const middleware = (request: NextRequest) => {
  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isPublic && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
};

export const config = {
  // Node.js runtime (stable since Next 15.5): better-auth/cookies pulls in APIs the Edge runtime lacks
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
