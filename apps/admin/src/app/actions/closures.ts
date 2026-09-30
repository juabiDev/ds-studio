"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";
import { dateKeyToDbDate, toShopDateKey } from "@ds-studio/database/dates";

import { closureIdSchema, closureSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

export const createClosure = async (input: {
  employeeId: string | null;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = closureSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  if (parsed.data.endDate < toShopDateKey()) return { ok: false, error: "Ese período ya pasó." };

  try {
    await prisma.closure.create({
      data: {
        employeeId: parsed.data.employeeId,
        startDate: dateKeyToDbDate(parsed.data.startDate),
        endDate: dateKeyToDbDate(parsed.data.endDate),
        reason: parsed.data.reason || null,
      },
    });
  } catch (error) {
    console.error("[createClosure]", error);
    return { ok: false, error: "No se pudo guardar el cierre." };
  }

  revalidatePath("/cierres");
  return { ok: true };
};

/** Soft delete: the closure stops blocking bookings but stays in the database. */
export const deleteClosure = async (input: { closureId: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = closureIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    await prisma.closure.update({ where: { id: parsed.data.closureId }, data: { deletedAt: new Date() } });
  } catch (error) {
    console.error("[deleteClosure]", error);
    return { ok: false, error: "No se pudo eliminar el cierre." };
  }

  revalidatePath("/cierres");
  return { ok: true };
};
