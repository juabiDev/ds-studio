// Pure date helpers shared by server and client code (no Prisma runtime imported).
// Dates travel as "YYYY-MM-DD" keys and times as "HH:mm", both in the shop's local time,
// matching how Availability and Appointment store them.

import type { DayOfWeek } from "./generated/prisma/enums";

export const SHOP_TIME_ZONE = "America/Montevideo";
export const SLOT_MINUTES = 30;

const WEEKDAYS: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Today's (or `date`'s) calendar day in the shop's time zone, as "YYYY-MM-DD". */
export const toShopDateKey = (date: Date = new Date()) => dateKeyFormatter.format(date);

/** Minutes since midnight right now in the shop's time zone. */
export const shopNowMinutes = (date: Date = new Date()) => timeToMinutes(timeFormatter.format(date));

export const addDaysToKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** `@db.Date` columns round-trip as UTC midnight. */
export const dateKeyToDbDate = (key: string) => new Date(`${key}T00:00:00.000Z`);

export const dbDateToKey = (date: Date) => date.toISOString().slice(0, 10);

export const weekdayOfKey = (key: string): DayOfWeek => WEEKDAYS[dateKeyToDbDate(key).getUTCDay()];

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
