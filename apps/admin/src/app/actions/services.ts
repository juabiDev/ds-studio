"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";

import { firstIssue, idSchema, serviceSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

export interface ServiceInput {
  name: string;
  duration: number;
  price: number | null;
}

// The new-booking form lists services too
const revalidate = () => {
  revalidatePath("/servicios");
  revalidatePath("/turnos/nuevo");
};

export const createService = async (input: ServiceInput): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    await prisma.service.create({ data: parsed.data });
  } catch (error) {
    console.error("[createService]", error);
    return { ok: false, error: "No se pudo crear el servicio." };
  }

  revalidate();
  return { ok: true };
};

/** Existing appointments keep their own duration snapshot, so editing never moves booked turns. */
export const updateService = async (input: ServiceInput & { id: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsedId = idSchema.safeParse(input);
  const parsed = serviceSchema.safeParse(input);
  if (!parsedId.success) return { ok: false, error: "Datos inválidos." };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const { count } = await prisma.service.updateMany({
      where: { id: parsedId.data.id, deletedAt: null },
      data: parsed.data,
    });
    if (count === 0) return { ok: false, error: "Ese servicio ya no existe." };
  } catch (error) {
    console.error("[updateService]", error);
    return { ok: false, error: "No se pudo guardar el servicio." };
  }

  revalidate();
  return { ok: true };
};

/** Soft delete: it disappears from the site and new bookings; booked turns keep it. */
export const deleteService = async (input: { id: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const remaining = await prisma.service.count({ where: { deletedAt: null, id: { not: parsed.data.id } } });
    if (remaining === 0) return { ok: false, error: "Tiene que quedar al menos un servicio para poder reservar." };

    await prisma.service.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date() } });
  } catch (error) {
    console.error("[deleteService]", error);
    return { ok: false, error: "No se pudo eliminar el servicio." };
  }

  revalidate();
  return { ok: true };
};
