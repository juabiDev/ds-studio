import "server-only";

import { prisma } from "@ds-studio/database";
import { addDaysToKey, dateKeyToDbDate, dbDateToKey, toShopDateKey } from "@ds-studio/database/dates";

const PERIOD_DAYS = 30;
const WEEKS = 8;

export interface PeriodTotals {
  /** Every appointment that wasn't cancelled */
  bookings: number;
  cancelled: number;
  completed: number;
  noShows: number;
  /** NO_SHOW / (COMPLETED + NO_SHOW); null when nothing was marked yet */
  noShowRate: number | null;
  /** Sum of the current service price over completed turns (an estimate: prices change) */
  revenue: number;
  /** Share of bookings made from the public site; null with no bookings */
  onlineShare: number | null;
}

export interface CountRow {
  label: string;
  count: number;
}

export interface BarberRow {
  id: string;
  name: string;
  completed: number;
  noShows: number;
  revenue: number;
}

export interface ShopStats {
  current: PeriodTotals;
  previous: PeriodTotals;
  weekly: CountRow[];
  byHour: CountRow[];
  byWeekday: CountRow[];
  byBarber: BarberRow[];
}

type Row = Awaited<ReturnType<typeof loadAppointments>>[number];

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
// Monday first, as the shop's week reads
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const loadAppointments = (fromKey: string, toKey: string) =>
  prisma.appointment.findMany({
    where: { deletedAt: null, date: { gte: dateKeyToDbDate(fromKey), lte: dateKeyToDbDate(toKey) } },
    select: {
      date: true,
      time: true,
      status: true,
      source: true,
      employee: { select: { id: true, name: true } },
      service: { select: { price: true } },
    },
  });

const priceOf = (row: Row) => (row.service.price ? row.service.price.toNumber() : 0);

const totals = (rows: Row[]): PeriodTotals => {
  const active = rows.filter((r) => r.status !== "CANCELLED");
  const completed = rows.filter((r) => r.status === "COMPLETED");
  const noShows = rows.filter((r) => r.status === "NO_SHOW").length;
  const marked = completed.length + noShows;

  return {
    bookings: active.length,
    cancelled: rows.length - active.length,
    completed: completed.length,
    noShows,
    noShowRate: marked ? noShows / marked : null,
    revenue: completed.reduce((sum, r) => sum + priceOf(r), 0),
    onlineShare: active.length ? active.filter((r) => r.source === "ONLINE").length / active.length : null,
  };
};

const countBy = <K extends string | number>(rows: Row[], keyOf: (r: Row) => K) => {
  const counts = new Map<K, number>();
  for (const r of rows) counts.set(keyOf(r), (counts.get(keyOf(r)) ?? 0) + 1);
  return counts;
};

/** "6 oct" */
const shortDate = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

/** Last 30 days vs the 30 before, plus 8-week patterns. All in shop dates, today included. */
export const getShopStats = async (): Promise<ShopStats> => {
  const today = toShopDateKey();
  const currentFrom = addDaysToKey(today, -(PERIOD_DAYS - 1));
  const previousFrom = addDaysToKey(currentFrom, -PERIOD_DAYS);

  // Weeks start on Monday; the current (partial) week is the last column
  const weekday = dateKeyToDbDate(today).getUTCDay();
  const thisMonday = addDaysToKey(today, -((weekday + 6) % 7));
  const firstMonday = addDaysToKey(thisMonday, -7 * (WEEKS - 1));

  const fromKey = previousFrom < firstMonday ? previousFrom : firstMonday;
  const rows = await loadAppointments(fromKey, today);
  const withKey = rows.map((r) => ({ row: r, key: dbDateToKey(r.date) }));

  const inRange = (from: string, to: string) => withKey.filter((x) => x.key >= from && x.key <= to).map((x) => x.row);
  const current = inRange(currentFrom, today);
  const recentWeeks = inRange(firstMonday, today).filter((r) => r.status !== "CANCELLED");

  const weekly = Array.from({ length: WEEKS }, (_, i) => {
    const start = addDaysToKey(firstMonday, 7 * i);
    const end = addDaysToKey(start, 6);
    return { label: shortDate(start), count: inRange(start, end).filter((r) => r.status !== "CANCELLED").length };
  });

  const hourCounts = countBy(recentWeeks, (r) => r.time);
  const byHour = [...hourCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }));

  const weekdayCounts = countBy(recentWeeks, (r) => r.date.getUTCDay());
  const byWeekday = WEEKDAY_ORDER.map((d) => ({ label: WEEKDAY_SHORT[d], count: weekdayCounts.get(d) ?? 0 }));

  const barbers = new Map<string, BarberRow>();
  for (const r of current) {
    const row = barbers.get(r.employee.id) ?? { id: r.employee.id, name: r.employee.name, completed: 0, noShows: 0, revenue: 0 };
    if (r.status === "COMPLETED") {
      row.completed += 1;
      row.revenue += priceOf(r);
    }
    if (r.status === "NO_SHOW") row.noShows += 1;
    barbers.set(r.employee.id, row);
  }

  return {
    current: totals(current),
    previous: totals(inRange(previousFrom, addDaysToKey(currentFrom, -1))),
    weekly,
    byHour,
    byWeekday,
    byBarber: [...barbers.values()].sort((a, b) => b.completed - a.completed),
  };
};
