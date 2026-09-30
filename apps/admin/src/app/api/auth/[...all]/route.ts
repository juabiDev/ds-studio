import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@ds-studio/auth/server";

// Better Auth's HTTP endpoints (/api/auth/*). Sign-in/out go through server actions and
// route handlers, but session refresh and future client calls use these.
export const { GET, POST } = toNextJsHandler(auth);
