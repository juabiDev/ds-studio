// Booking rules shared by the public site, the admin and scripts. The Prisma client is passed in
// (instead of importing the app singleton) so this also runs outside Next.js, e.g. in tests.

import {
  SLOT_MINUTES,
  addDaysToKey,
  dateKeyToDbDate,
  minutesToTime,
  shopNowMinutes,
  timeToMinutes,
  toShopDateKey,
  weekdayOfKey,
} from "./dates";
import { Prisma, type AppointmentSource, type PrismaClient } from "./generated/prisma/client";
import { normalizePhone } from "./phone";

/** How far ahead customers can book online (today + 13 days = two weeks). */
export const BOOKING_WINDOW_DAYS = 14;
/** Same-day online bookings need at least this much notice. */
export const SAME_DAY_LEAD_MINUTES = 30;
/** A phone number can hold at most this many upcoming online bookings. */
export const MAX_ACTIVE_BOOKINGS_PER_PHONE = 2;
export const DEFAULT_DURATION_MINUTES = SLOT_MINUTES;

const SERIALIZATION_RETRIES = 3;

type Db = Prisma.TransactionClient;

export const isDateInBookingWindow = (dateKey: string) => {
  const today = toShopDateKey();
  return dateKey >= today && dateKey <= addDaysToKey(today, BOOKING_WINDOW_DAYS - 1);
};

export { normalizePhone };

export interface OpenSlot {
  time: string;
  /** Barbers free for the whole service starting at `time`, in display order */
  employeeIds: string[];
}

interface FindOpenSlotsOptions {
  dateKey: string;
  durationMinutes: number;
  employeeId: string | null;
  /** Online bookings need SAME_DAY_LEAD_MINUTES of notice; staff can record walk-ins right now. */
  enforceLeadTime?: boolean;
}

/**
 * Start times where a service of `durationMinutes` fits for a barber: the barber must have an
 * open slot at every 30-min step the service covers (so lunch breaks and closing time are
 * respected), no closure on that date, and no overlapping appointment.
 */
export const findOpenSlots = async (
  db: Db,
  { dateKey, durationMinutes, employeeId, enforceLeadTime = true }: FindOpenSlotsOptions,
): Promise<OpenSlot[]> => {
  const date = dateKeyToDbDate(dateKey);
  const employeeFilter = employeeId ? { employeeId } : {};

  const [assignments, appointments, closures] = await Promise.all([
    db.employeeAvailability.findMany({
      where: {
        ...employeeFilter,
        available: true,
        employee: { deletedAt: null },
        availability: {
          available: true,
          deletedAt: null,
          OR: [{ date }, { date: null, day: weekdayOfKey(dateKey) }],
        },
      },
      select: { employeeId: true, availability: { select: { time: true } } },
      orderBy: { employee: { createdAt: "asc" } },
    }),
    db.appointment.findMany({
      where: { ...employeeFilter, date, deletedAt: null, status: { not: "CANCELLED" } },
      select: { employeeId: true, time: true, durationMinutes: true },
    }),
    db.closure.findMany({
      where: { deletedAt: null, startDate: { lte: date }, endDate: { gte: date } },
      select: { employeeId: true },
    }),
  ]);

  return computeOpenSlots({
    assignments: assignments.map((a) => ({ employeeId: a.employeeId, time: a.availability.time })),
    appointments,
    closedEmployeeIds: closures.map((c) => c.employeeId),
    durationMinutes,
    cutoffMinutes: enforceLeadTime && dateKey === toShopDateKey() ? shopNowMinutes() + SAME_DAY_LEAD_MINUTES : -1,
  });
};

interface ComputeOpenSlotsInput {
  /** Open (barber, time) slots for one day */
  assignments: { employeeId: string; time: string }[];
  /** Non-cancelled appointments that day */
  appointments: { employeeId: string; time: string; durationMinutes: number }[];
  /** Barbers with a closure that day; null = the whole shop is closed */
  closedEmployeeIds: (string | null)[];
  durationMinutes: number;
  /** Start times before this minute of the day are skipped (-1 = none) */
  cutoffMinutes: number;
}

/** Pure core of findOpenSlots, shared with the per-day occupancy so both agree on what "free" means. */
const computeOpenSlots = ({
  assignments,
  appointments,
  closedEmployeeIds,
  durationMinutes,
  cutoffMinutes,
}: ComputeOpenSlotsInput): OpenSlot[] => {
  if (closedEmployeeIds.includes(null)) return [];
  const closedEmployees = new Set(closedEmployeeIds);

  const openStartsByEmployee = new Map<string, Set<number>>();
  for (const a of assignments) {
    if (closedEmployees.has(a.employeeId)) continue;
    const starts = openStartsByEmployee.get(a.employeeId) ?? new Set<number>();
    starts.add(timeToMinutes(a.time));
    openStartsByEmployee.set(a.employeeId, starts);
  }

  const steps = Math.ceil(durationMinutes / SLOT_MINUTES);
  const slots = new Map<number, string[]>();

  for (const [id, starts] of openStartsByEmployee) {
    const booked = appointments.filter((ap) => ap.employeeId === id);

    for (const start of starts) {
      if (start < cutoffMinutes) continue;

      const end = start + durationMinutes;
      const coversOpenSlots = Array.from({ length: steps }, (_, i) => start + i * SLOT_MINUTES).every((m) =>
        starts.has(m),
      );
      const overlaps = booked.some((ap) => {
        const apStart = timeToMinutes(ap.time);
        return start < apStart + ap.durationMinutes && apStart < end;
      });

      if (coversOpenSlots && !overlaps) slots.set(start, [...(slots.get(start) ?? []), id]);
    }
  }

  return [...slots.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, employeeIds]) => ({ time: minutesToTime(start), employeeIds }));
};

/**
 * free = nothing booked, partial = some bookings and room left, full = no 30-min slot left,
 * closed = no slots at all that day (closure or no schedule) and nothing booked.
 */
export type DayOccupancy = "free" | "partial" | "full" | "closed";

interface OccupancyOptions {
  fromKey: string;
  toKey: string;
  /** null = all barbers together */
  employeeId: string | null;
}

/** Occupancy for every day in [fromKey, toKey] with three queries, for coloring a calendar. */
export const getOccupancyByDay = async (
  db: Db,
  { fromKey, toKey, employeeId }: OccupancyOptions,
): Promise<Record<string, DayOccupancy>> => {
  const from = dateKeyToDbDate(fromKey);
  const to = dateKeyToDbDate(toKey);
  const employeeFilter = employeeId ? { employeeId } : {};

  const [assignments, appointments, closures] = await Promise.all([
    db.employeeAvailability.findMany({
      where: {
        ...employeeFilter,
        available: true,
        employee: { deletedAt: null },
        availability: {
          available: true,
          deletedAt: null,
          OR: [{ date: { gte: from, lte: to } }, { date: null }],
        },
      },
      select: { employeeId: true, availability: { select: { time: true, day: true, date: true } } },
    }),
    db.appointment.findMany({
      where: { ...employeeFilter, date: { gte: from, lte: to }, deletedAt: null, status: { not: "CANCELLED" } },
      select: { employeeId: true, time: true, durationMinutes: true, date: true },
    }),
    db.closure.findMany({
      where: { deletedAt: null, startDate: { lte: to }, endDate: { gte: from } },
      select: { employeeId: true, startDate: true, endDate: true },
    }),
  ]);

  const result: Record<string, DayOccupancy> = {};
  for (let key = fromKey; key <= toKey; key = addDaysToKey(key, 1)) {
    const date = dateKeyToDbDate(key).getTime();
    const weekday = weekdayOfKey(key);

    // Same rule as findOpenSlots: date-specific slots plus the weekday's recurring ones
    const dayAssignments = assignments
      .filter((a) => (a.availability.date ? a.availability.date.getTime() === date : a.availability.day === weekday))
      .map((a) => ({ employeeId: a.employeeId, time: a.availability.time }));
    const dayAppointments = appointments.filter((a) => a.date.getTime() === date);
    const closedEmployeeIds = closures
      .filter((c) => c.startDate.getTime() <= date && c.endDate.getTime() >= date)
      .map((c) => c.employeeId);

    const base = { assignments: dayAssignments, closedEmployeeIds, durationMinutes: SLOT_MINUTES, cutoffMinutes: -1 };
    const capacity = computeOpenSlots({ ...base, appointments: [] }).length;
    const open = computeOpenSlots({ ...base, appointments: dayAppointments }).length;
    const booked = dayAppointments.length;

    if (capacity === 0) result[key] = booked > 0 ? "full" : "closed";
    else if (booked === 0) result[key] = "free";
    else result[key] = open === 0 ? "full" : "partial";
  }
  return result;
};

export interface BookAppointmentInput {
  serviceId: string;
  /** null = any barber: the first one free at that time is assigned */
  employeeId: string | null;
  dateKey: string;
  time: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail?: string | null;
  source: AppointmentSource;
  clientIpHash?: string | null;
}

export type BookAppointmentResult =
  | { ok: true; appointment: { id: string; serviceName: string; barberName: string } }
  | { ok: false; reason: "SERVICE_NOT_FOUND" | "SLOT_TAKEN" | "PHONE_LIMIT" | "DUPLICATE" };

/**
 * Postgres aborts one of two conflicting SERIALIZABLE transactions with SQLSTATE 40001. Prisma
 * reports it as P2034 when it happens mid-query, but as a raw DriverAdapterError
 * (kind "TransactionWriteConflict") when it happens at COMMIT, so both shapes are checked.
 */
const isSerializationFailure = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return true;
  if (typeof error !== "object" || error === null) return false;

  const cause = (error as { cause?: { kind?: string; originalCode?: string } }).cause;
  if (cause?.kind === "TransactionWriteConflict" || cause?.originalCode === "40001") return true;
  return false;
};

/**
 * Re-checks availability and creates the appointment in one SERIALIZABLE transaction, so two
 * concurrent requests can never both take the same barber + time. Postgres may abort a
 * transaction that conflicts with another one; it's retried and, if the slot is gone by then,
 * reported as SLOT_TAKEN.
 */
export const bookAppointment = async (
  prisma: PrismaClient,
  input: BookAppointmentInput,
): Promise<BookAppointmentResult> => {
  const phone = input.customerPhone ? normalizePhone(input.customerPhone) : null;
  const isOnline = input.source === "ONLINE";

  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx): Promise<BookAppointmentResult> => {
          const service = await tx.service.findFirst({ where: { id: input.serviceId, deletedAt: null } });
          if (!service) return { ok: false, reason: "SERVICE_NOT_FOUND" };

          if (isOnline && phone) {
            const upcoming = await tx.appointment.findMany({
              where: {
                customerPhone: phone,
                source: "ONLINE",
                status: "CONFIRMED",
                deletedAt: null,
                date: { gte: dateKeyToDbDate(toShopDateKey()) },
              },
              select: { date: true, time: true },
            });
            const sameDay = upcoming.some((a) => a.date.getTime() === dateKeyToDbDate(input.dateKey).getTime());
            if (sameDay) return { ok: false, reason: "DUPLICATE" };
            if (upcoming.length >= MAX_ACTIVE_BOOKINGS_PER_PHONE) return { ok: false, reason: "PHONE_LIMIT" };
          }

          const durationMinutes = service.duration ?? DEFAULT_DURATION_MINUTES;
          const slots = await findOpenSlots(tx, {
            dateKey: input.dateKey,
            durationMinutes,
            employeeId: input.employeeId,
            enforceLeadTime: isOnline,
          });
          const employeeId = slots.find((s) => s.time === input.time)?.employeeIds[0];
          if (!employeeId) return { ok: false, reason: "SLOT_TAKEN" };

          const appointment = await tx.appointment.create({
            data: {
              serviceId: service.id,
              employeeId,
              date: dateKeyToDbDate(input.dateKey),
              time: input.time,
              durationMinutes,
              customerName: input.customerName,
              customerPhone: phone,
              customerEmail: input.customerEmail?.trim().toLowerCase() || null,
              source: input.source,
              clientIpHash: input.clientIpHash ?? null,
            },
            select: { id: true, employee: { select: { name: true } } },
          });

          return {
            ok: true,
            appointment: { id: appointment.id, serviceName: service.name, barberName: appointment.employee.name },
          };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (!isSerializationFailure(error)) throw error;
      if (attempt >= SERIALIZATION_RETRIES) return { ok: false, reason: "SLOT_TAKEN" };
    }
  }
};
