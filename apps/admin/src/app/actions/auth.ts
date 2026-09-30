"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { z } from "zod";

import { isLoginRateLimited } from "@ds-studio/auth/login-rate-limit";
import { auth } from "@ds-studio/auth/server";
import { prisma } from "@ds-studio/database";

const signInSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type SignInResult = { error: string } | undefined;

const INVALID_CREDENTIALS = "Email o contraseña incorrectos.";
const TOO_MANY_ATTEMPTS = "Demasiados intentos. Esperá un minuto.";

export const signIn = async (formData: FormData): Promise<SignInResult> => {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Ingresá un email y contraseña válidos." };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Limits password guessing both per connection and per targeted account
  if (isLoginRateLimited([`ip:${ip}`, `email:${parsed.data.email}`])) return { error: TOO_MANY_ATTEMPTS };

  // Only active admins may sign in here. Same message as a wrong password, so the form
  // doesn't reveal which emails have accounts.
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true, deletedAt: true },
  });
  if (user?.role !== "ADMIN" || user.deletedAt) return { error: INVALID_CREDENTIALS };

  try {
    // nextCookies() sets the session cookie on this action's response
    await auth.api.signInEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.status === "TOO_MANY_REQUESTS" ? TOO_MANY_ATTEMPTS : INVALID_CREDENTIALS };
    }
    console.error("[signIn]", error);
    return { error: "No se pudo iniciar sesión. Probá de nuevo." };
  }

  redirect("/");
};
