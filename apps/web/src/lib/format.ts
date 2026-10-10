import { dateKeyToDbDate } from "@ds-studio/database/dates";

import { DAY_NAMES, MONTH_NAMES } from "@/lib/home-content";

/** "Lun 28 sep" — used by the booking wizard and the cancel page. */
export const formatDateKey = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].toLowerCase()}`;
};

/** "28 sep" — used in shop notification emails. */
export const formatDayMonth = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].toLowerCase()}`;
};
