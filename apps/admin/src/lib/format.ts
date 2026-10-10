import type { AppointmentStatus, DayOfWeek } from "@ds-studio/database";
import { normalizePhone } from "@ds-studio/database/phone";
import { dateKeyToDbDate } from "@ds-studio/database/dates";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const WEEKDAYS: { value: DayOfWeek; short: string; label: string }[] = [
  { value: "MONDAY", short: "Lun", label: "Lunes" },
  { value: "TUESDAY", short: "Mar", label: "Martes" },
  { value: "WEDNESDAY", short: "Mié", label: "Miércoles" },
  { value: "THURSDAY", short: "Jue", label: "Jueves" },
  { value: "FRIDAY", short: "Vie", label: "Viernes" },
  { value: "SATURDAY", short: "Sáb", label: "Sábado" },
  { value: "SUNDAY", short: "Dom", label: "Domingo" },
];

/** "Lunes 28 sep" */
export const formatDateKey = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
};

/** "1 turno" / "3 turnos" */
export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Uruguayan numbers stored as E.164 shown the way people dial them locally:
 * "+59898765432" → "098 765 432", "+59824001234" → "2400 1234". Anything else is shown as stored.
 */
export const formatPhone = (phone: string) => {
  const local = /^\+598(\d{8})$/.exec(phone)?.[1];
  if (!local) return phone;
  return local.startsWith("9") ? `0${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}` : `${local.slice(0, 4)} ${local.slice(4)}`;
};

/** wa.me wants the international number without "+"; phones are stored normalized (E.164). */
export const whatsappLink = (phone: string) => `https://wa.me/${normalizePhone(phone).replace("+", "")}`;

/** Status badge text and colors, shared by the agenda and the customer history. */
export const STATUS_LABEL: Record<AppointmentStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmado", className: "bg-emerald-500/15 text-emerald-300" },
  COMPLETED: { label: "Completado", className: "bg-secondary text-muted-foreground" },
  NO_SHOW: { label: "No vino", className: "bg-amber-500/15 text-amber-300" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-red-300" },
};
