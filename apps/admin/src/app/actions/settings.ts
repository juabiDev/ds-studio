"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { WEEK_DAYS, siteSettingsSchema } from "@ds-studio/database/settings";
import { saveSiteSettings } from "@ds-studio/database/settings-store";

import { WEEKDAYS } from "@/lib/format";
import type { ActionResult } from "@/types/admin";

/** "-34.906, -56.178" (as copied from Google Maps) -> numbers; NaN fails validation. */
const parseCoordinates = (value: string) => {
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  return { latitude: lat ?? Number.NaN, longitude: lng ?? Number.NaN };
};

export const updateSiteSettings = async (formData: FormData): Promise<ActionResult> => {
  await requireAdmin();

  const text = (key: string) => String(formData.get(key) ?? "");

  const parsed = siteSettingsSchema.safeParse({
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    street: text("street"),
    neighborhood: text("neighborhood"),
    postalCode: text("postalCode"),
    city: text("city"),
    ...parseCoordinates(text("coordinates")),
    instagramUrl: text("instagramUrl").trim(),
    facebookUrl: text("facebookUrl").trim(),
    openingHours: Object.fromEntries(
      WEEK_DAYS.map((day) => [
        day,
        formData.get(`${day}.open`) === "on" ? { opens: text(`${day}.opens`), closes: text(`${day}.closes`) } : null,
      ]),
    ),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // Name the day so "Hora inválida" is actionable
    const day = issue?.path[0] === "openingHours" ? WEEKDAYS.find((d) => d.value === issue.path[1])?.label : null;
    return { ok: false, error: `${day ? `${day}: ` : ""}${issue?.message ?? "Datos inválidos."}` };
  }

  try {
    await saveSiteSettings(parsed.data);
  } catch (error) {
    console.error("[updateSiteSettings]", error);
    return { ok: false, error: "No se pudieron guardar los ajustes." };
  }

  revalidatePath("/ajustes");
  return { ok: true };
};
