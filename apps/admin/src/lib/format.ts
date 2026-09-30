import type { DayOfWeek } from "@ds-studio/database";
import { normalizePhone } from "@ds-studio/database/booking";
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

/** wa.me wants the international number without "+"; phones are stored normalized (E.164). */
export const whatsappLink = (phone: string) => `https://wa.me/${normalizePhone(phone).replace("+", "")}`;
