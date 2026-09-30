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

/**
 * Canonical E.164 form so "099 123 456", "99123456" and "+598 99 123 456" count as the same
 * customer. Numbers without a country code are assumed to be Uruguayan.
 */
export const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("598")) return `+${digits}`;
  return `+598${digits.replace(/^0/, "")}`;
};

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

  if (closures.some((c) => c.employeeId === null)) return [];
  const closedEmployees = new Set(closures.map((c) => c.employeeId));

  const openStartsByEmployee = new Map<string, Set<number>>();
  for (const a of assignments) {
    if (closedEmployees.has(a.employeeId)) continue;
    const starts = openStartsByEmployee.get(a.employeeId) ?? new Set<number>();
    starts.add(timeToMinutes(a.availability.time));
    openStartsByEmployee.set(a.employeeId, starts);
  }

  const cutoff = enforceLeadTime && dateKey === toShopDateKey() ? shopNowMinutes() + SAME_DAY_LEAD_MINUTES : -1;
  const steps = Math.ceil(durationMinutes / SLOT_MINUTES);
  const slots = new Map<number, string[]>();

  for (const [id, starts] of openStartsByEmployee) {
    const booked = appointments.filter((ap) => ap.employeeId === id);

    for (const start of starts) {
      if (start < cutoff) continue;

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

export interface BookAppointmentInput {
  serviceId: string;
  /** null = any barber: the first one free at that time is assigned */
  employeeId: string | null;
  dateKey: string;
  time: string;
  customerName: string;
  customerPhone: string | null;
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
