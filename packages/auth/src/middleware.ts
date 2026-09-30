import type { NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic check: is there a session cookie at all? It doesn't validate the session;
 * requireAdmin() does the real check (database session + ADMIN role) on every page and action.
 */
export const hasSessionCookie = (request: NextRequest) => getSessionCookie(request) !== null;
