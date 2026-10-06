"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@ds-studio/auth";
import { prisma, type AppointmentStatus } from "@ds-studio/database";
import { getOccupancyByDay, type DayOccupancy } from "@ds-studio/database/booking";
import { addDaysToKey, toShopDateKey } from "@ds-studio/database/dates";
import { sendStaffCancellationNotice } from "@ds-studio/messaging";
import { sendStaffCancellationEmail } from "@ds-studio/messaging/email";

import { appointmentStatusSchema, monthOccupancySchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

export const setAppointmentStatus = async (input: {
  appointmentId: string;
  status: AppointmentStatus;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = appointmentStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { appointmentId, status } = parsed.data;
  const cancelling = status === "CANCELLED";
  // "Deshacer": completed/no-show go back to confirmed. Cancelled can't, since the customer was already notified.
  const fromStatuses: AppointmentStatus[] = status === "CONFIRMED" ? ["COMPLETED", "NO_SHOW"] : ["CONFIRMED"];

  try {
    // Guarding on the current status means a double tap can't re-notify the customer
    const { count } = await prisma.appointment.updateMany({
      where: { id: appointmentId, deletedAt: null, status: { in: fromStatuses } },
      data: cancelling ? { status, cancelledAt: new Date(), cancelledBy: "STAFF" } : { status },
    });
    if (count === 0) return { ok: false, error: "Ese turno ya fue actualizado." };
  } catch (error) {
    console.error("[setAppointmentStatus]", error);
    return { ok: false, error: "No se pudo actualizar el turno." };
  }

  // Tell the customer on WhatsApp and by email, after responding so the admin UI isn't kept waiting
  if (cancelling) {
    after(() => Promise.all([sendStaffCancellationNotice(appointmentId), sendStaffCancellationEmail(appointmentId)]));
  }

  revalidatePath("/");
  return { ok: true };
};

/** Calendar colors for one month ("YYYY-MM"). Past days are left out: their occupancy isn't actionable. */
export const getMonthOccupancy = async (input: {
  month: string;
  employeeId: string | null;
}): Promise<{ ok: true; days: Record<string, DayOccupancy> } | { ok: false; error: string }> => {
  await requireAdmin();

  const parsed = monthOccupancySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { month, employeeId } = parsed.data;
  const [year, monthNumber] = month.split("-").map(Number);
  const firstOfNext = `${monthNumber === 12 ? year + 1 : year}-${String((monthNumber % 12) + 1).padStart(2, "0")}-01`;
  const lastDay = addDaysToKey(firstOfNext, -1);
  const today = toShopDateKey();
  const fromKey = `${month}-01` > today ? `${month}-01` : today;

  if (fromKey > lastDay) return { ok: true, days: {} };

  try {
    const days = await getOccupancyByDay(prisma, { fromKey, toKey: lastDay, employeeId });
    return { ok: true, days };
  } catch (error) {
    console.error("[getMonthOccupancy]", error);
    return { ok: false, error: "No se pudo cargar la ocupación." };
  }
};
