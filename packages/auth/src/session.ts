import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@ds-studio/database";

import { auth } from "./auth";

/** The signed-in user's profile, or null. Soft-deleted users count as signed out. */
export const getCurrentUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return prisma.user.findFirst({ where: { id: session.user.id, deletedAt: null } });
};

/** Guards admin pages and actions; redirects anyone who isn't an admin. */
export const requireAdmin = async (redirectTo = "/login") => {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect(redirectTo);
  return user;
};
