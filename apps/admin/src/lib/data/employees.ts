import "server-only";

import { prisma } from "@ds-studio/database";

import type { NamedOption } from "@/types/admin";

/** Barbers in creation order: the order every chip row and select uses. */
export const getActiveBarbers = (): Promise<NamedOption[]> =>
  prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

/** Barbers with how many weekly slots each has open vs blocked. */
export const getBarbersWithSlotCounts = async () => {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      specialty: true,
      availabilities: {
        where: { availability: { deletedAt: null } },
        select: { available: true },
      },
    },
  });

  return employees.map((e) => {
    const open = e.availabilities.filter((a) => a.available).length;
    return { ...e, open, blocked: e.availabilities.length - open };
  });
};

export type BarberWithSlotCounts = Awaited<ReturnType<typeof getBarbersWithSlotCounts>>[number];
