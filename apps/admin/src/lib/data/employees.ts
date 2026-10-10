import "server-only";

import { prisma } from "@ds-studio/database";

import { resolveMediaUrl } from "@/lib/data/gallery";
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

/** One barber's public profile and current profile picture, for the edit page. */
export const getBarberProfile = async (employeeId: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: {
      id: true,
      name: true,
      role: true,
      specialty: true,
      experience: true,
      images: {
        where: { thumbnail: { deletedAt: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { thumbnail: { select: { imageUrl: true } } },
      },
    },
  });
  if (!employee) return null;

  const { images, ...profile } = employee;
  const photo = images[0]?.thumbnail.imageUrl;
  return { ...profile, photoUrl: photo ? resolveMediaUrl(photo) : null };
};

export type BarberProfile = NonNullable<Awaited<ReturnType<typeof getBarberProfile>>>;
