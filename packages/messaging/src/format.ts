import { dateKeyToDbDate } from "@ds-studio/database/dates";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "martes 29 de septiembre" */
export const formatLongDate = (dateKey: string) => {
  const d = dateKeyToDbDate(dateKey);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
};

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName;

/** WhatsApp rejects template parameters with newlines, tabs or long runs of spaces. */
export const templateParam = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 200);
