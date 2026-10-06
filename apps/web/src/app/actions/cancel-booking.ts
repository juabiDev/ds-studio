"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { normalizePhone } from "@ds-studio/database/booking";
import { cancelAppointmentFromLink } from "@ds-studio/messaging/email";

import { formatDayMonth } from "@/lib/format";
import { notifyCustomerCancellation } from "@/lib/notify";
import { cancelLinkSchema } from "@/lib/validation/booking";

/** Submitted from the email cancel page. Always lands back on that page, which shows the new state. */
export const cancelBookingFromLink = async (formData: FormData) => {
  const parsed = cancelLinkSchema.safeParse({ id: formData.get("id"), t: formData.get("t") });
  if (!parsed.success) redirect("/cancelar-turno/invalido");

  const { id, t } = parsed.data;
  const pagePath = `/cancelar-turno/${id}?t=${encodeURIComponent(t)}`;

  try {
    const result = await cancelAppointmentFromLink(id, t);
    if (result.ok) {
      const a = result.appointment;
      after(() =>
        notifyCustomerCancellation({
          customerName: a.customerName,
          customerPhone: a.customerPhone ? normalizePhone(a.customerPhone) : "sin teléfono",
          serviceName: a.serviceName,
          barberName: a.barberName,
          dateLabel: formatDayMonth(a.dateKey),
          time: a.time,
        }),
      );
    }
  } catch (error) {
    console.error("[cancelBookingFromLink]", error);
    redirect(`${pagePath}&error=1`);
  }

  redirect(pagePath);
};
