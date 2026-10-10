"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";
import { DEFAULT_DURATION_MINUTES, bookAppointment, findOpenSlots } from "@ds-studio/database/booking";
import { toShopDateKey } from "@ds-studio/database/dates";
import { sendBookingConfirmation } from "@ds-studio/messaging";
import { sendBookingConfirmationEmail } from "@ds-studio/messaging/email";

import { adminBookingSchema, adminOpenTimesSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

/** Free start times for one barber. Staff can book right now (no online lead time) but not in the past. */
export const getAdminOpenTimes = async (input: {
  serviceId: string;
  employeeId: string;
  date: string;
}): Promise<{ ok: true; times: string[] } | { ok: false; error: string }> => {
  await requireAdmin();

  const parsed = adminOpenTimesSchema.safeParse(input);
  if (!parsed.success || parsed.data.date < toShopDateKey()) return { ok: false, error: "Datos inválidos." };

  try {
    const service = await prisma.service.findFirst({ where: { id: parsed.data.serviceId, deletedAt: null } });
    if (!service) return { ok: false, error: "Servicio no encontrado." };

    const slots = await findOpenSlots(prisma, {
      dateKey: parsed.data.date,
      durationMinutes: service.duration ?? DEFAULT_DURATION_MINUTES,
      employeeId: parsed.data.employeeId,
      enforceLeadTime: false,
    });
    return { ok: true, times: slots.map((s) => s.time) };
  } catch (error) {
    console.error("[getAdminOpenTimes]", error);
    return { ok: false, error: "No se pudieron cargar los horarios." };
  }
};

/** Phone or walk-in booking. Same availability rules and transaction as online bookings. */
export const createAdminBooking = async (input: {
  serviceId: string;
  employeeId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
}): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = adminBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  if (parsed.data.date < toShopDateKey()) return { ok: false, error: "No se pueden agendar turnos en el pasado." };

  try {
    const result = await bookAppointment(prisma, {
      serviceId: parsed.data.serviceId,
      employeeId: parsed.data.employeeId,
      dateKey: parsed.data.date,
      time: parsed.data.time,
      customerName: parsed.data.name,
      customerPhone: parsed.data.phone,
      customerEmail: parsed.data.email,
      source: "ADMIN",
    });

    if (!result.ok) {
      return {
        ok: false,
        error:
          result.reason === "SERVICE_NOT_FOUND"
            ? "Ese servicio ya no existe."
            : "Ese horario ya no está libre. Elige otro.",
      };
    }

    // Phone bookings get the same WhatsApp confirmation (with cancel button) and email as online ones
    const { id } = result.appointment;
    after(() => sendBookingConfirmation(id));
    if (parsed.data.email) after(() => sendBookingConfirmationEmail(id));
  } catch (error) {
    console.error("[createAdminBooking]", error);
    return { ok: false, error: "No se pudo guardar el turno." };
  }

  revalidatePath("/");
  return { ok: true };
};
