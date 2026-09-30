"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@ds-studio/auth";
import { prisma, type AppointmentStatus } from "@ds-studio/database";
import { sendStaffCancellationNotice } from "@ds-studio/messaging";

import { appointmentStatusSchema } from "@/lib/validation/admin";
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

  try {
    // Only a confirmed appointment can change state, so a double tap can't re-notify the customer
    const { count } = await prisma.appointment.updateMany({
      where: { id: appointmentId, deletedAt: null, status: "CONFIRMED" },
      data: cancelling ? { status, cancelledAt: new Date(), cancelledBy: "STAFF" } : { status },
    });
    if (count === 0) return { ok: false, error: "Ese turno ya fue actualizado." };
  } catch (error) {
    console.error("[setAppointmentStatus]", error);
    return { ok: false, error: "No se pudo actualizar el turno." };
  }

  // Tell the customer on WhatsApp, after responding so the admin UI isn't kept waiting
  if (cancelling) after(() => sendStaffCancellationNotice(appointmentId));

  revalidatePath("/");
  return { ok: true };
};
