import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@ds-studio/database";

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Better Auth server instance for the admin app. Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL
 * from the environment. Staff-only: public sign-up is disabled, accounts come from the
 * create-admin script.
 */
export const auth = betterAuth({
  appName: "DS STUDIO Admin",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // a week, so staff phones stay signed in
    updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
  },
  user: {
    additionalFields: {
      role: { type: ["ADMIN", "CUSTOMER"], required: false, defaultValue: "CUSTOMER", input: false },
    },
  },
  rateLimit: {
    enabled: true,
    // Slow down password guessing on the only public endpoint that matters
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
  // Must stay last: lets server actions set the session cookie
  plugins: [nextCookies()],
});
