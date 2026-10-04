import "server-only";

import { prisma } from "@ds-studio/database";

import type { NamedOption } from "@/types/admin";

export const getActiveServices = (): Promise<NamedOption[]> =>
  prisma.service.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
