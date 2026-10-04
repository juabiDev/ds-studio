import "server-only";

import { prisma } from "@ds-studio/database";
import { DEFAULT_DURATION_MINUTES } from "@ds-studio/database/booking";

import type { BarberOption, ServiceOption } from "@/types/booking";

export const getServiceOptions = async (): Promise<ServiceOption[]> => {
  const services = await prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration ?? DEFAULT_DURATION_MINUTES,
    price: s.price ? `$${s.price.toFixed(0)}` : null,
  }));
};

export const getBarberOptions = async (): Promise<BarberOption[]> => {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      // First image is the profile picture
      images: {
        where: { thumbnail: { deletedAt: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { thumbnail: { select: { imageUrl: true, variants: true } } },
      },
    },
  });

  return employees.map((e) => {
    const picture = e.images[0]?.thumbnail;
    const variants = (picture?.variants ?? {}) as Record<string, string>;
    return {
      id: e.id,
      name: e.name,
      role: e.role,
      specialty: e.specialty,
      experience: e.experience,
      photoUrl: picture?.imageUrl ?? null,
      avatarUrl: variants.sm ?? picture?.imageUrl ?? null,
    };
  });
};
