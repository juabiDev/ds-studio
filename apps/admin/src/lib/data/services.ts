import "server-only";

import { prisma } from "@ds-studio/database";
import { DEFAULT_DURATION_MINUTES } from "@ds-studio/database/booking";

import type { NamedOption } from "@/types/admin";

export const getActiveServices = (): Promise<NamedOption[]> =>
  prisma.service.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } });

export interface AdminService {
  id: string;
  name: string;
  /** Minutes; services saved without one show (and book) the default */
  duration: number;
  /** Plain number for the form; null = "Consultar" */
  price: number | null;
}

export const getServicesForAdmin = async (): Promise<AdminService[]> => {
  const services = await prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, duration: true, price: true },
  });
  // Decimal isn't serializable to client components
  return services.map((s) => ({
    ...s,
    duration: s.duration ?? DEFAULT_DURATION_MINUTES,
    price: s.price ? s.price.toNumber() : null,
  }));
};
