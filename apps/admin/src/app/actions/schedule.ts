"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma, type DayOfWeek } from "@ds-studio/database";

import { dayAvailabilitySchema, shopSlotSchema, slotAvailabilitySchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

/** Blocks or re-opens one barber's slot. The row is kept, so blocked slots stay visible. */
export const setSlotAvailability = async (input: {
  employeeId: string;
  availabilityId: string;
  available: boolean;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = slotAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { employeeId, availabilityId, available } = parsed.data;

  try {
    // Upsert so slots that were never assigned to this barber can be opened too
    await prisma.employeeAvailability.upsert({
      where: { employeeId_availabilityId: { employeeId, availabilityId } },
      create: { employeeId, availabilityId, available },
      update: { available },
    });
  } catch (error) {
    console.error("[setSlotAvailability]", error);
    return { ok: false, error: "No se pudo guardar el cambio." };
  }

  revalidatePath("/horarios");
  return { ok: true };
};

/** Blocks or re-opens every recurring slot of a weekday for one barber (e.g. a day off). */
export const setDayAvailability = async (input: {
  employeeId: string;
  day: DayOfWeek;
  available: boolean;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = dayAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { employeeId, day, available } = parsed.data;

  try {
    await prisma.employeeAvailability.updateMany({
      where: { employeeId, availability: { day, date: null, deletedAt: null } },
      data: { available },
    });
  } catch (error) {
    console.error("[setDayAvailability]", error);
    return { ok: false, error: "No se pudo guardar el cambio." };
  }

  revalidatePath("/horarios");
  return { ok: true };
};

/** Opens or closes a weekly slot for the whole shop (Availability.available), for every barber at once. */
export const setShopSlotAvailability = async (input: {
  availabilityId: string;
  available: boolean;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = shopSlotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    await prisma.availability.update({
      where: { id: parsed.data.availabilityId },
      data: { available: parsed.data.available },
    });
  } catch (error) {
    console.error("[setShopSlotAvailability]", error);
    return { ok: false, error: "No se pudo guardar el cambio." };
  }

  revalidatePath("/horarios");
  return { ok: true };
};
