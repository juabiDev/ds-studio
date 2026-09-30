// Booking integrity test against a real Postgres (local or Railway): concurrent double-booking,
// "any barber" assignment, closures and per-phone limits.
//
//   npm run db:stress-test
//
// Safe on a live database: it only creates rows with ids starting with "stress_", on time slots
// real barbers never have (23:00 / 23:30), and deletes all of them when it finishes, even on failure.

import { PrismaPg } from "@prisma/adapter-pg";

import { bookAppointment, findOpenSlots, normalizePhone, type BookAppointmentInput } from "../src/booking";
import { addDaysToKey, dateKeyToDbDate, toShopDateKey, weekdayOfKey } from "../src/dates";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 20 }) });

const P = "stress_";
const SERVICE_ID = `${P}service`;
const BARBERS = [`${P}barber_a`, `${P}barber_b`, `${P}barber_c`];
const TIMES = ["23:00", "23:30"];
/** Test days: the next 3 dates without any real closure (a holiday would make bookings fail). */
let DAYS: string[] = [];
const pickTestDays = async () => {
  const days: string[] = [];
  for (let n = 1; days.length < 3 && n <= 60; n++) {
    const day = addDaysToKey(toShopDateKey(), n);
    const date = dateKeyToDbDate(day);
    const closed = await prisma.closure.count({
      where: { deletedAt: null, startDate: { lte: date }, endDate: { gte: date } },
    });
    if (closed === 0) days.push(day);
  }
  if (days.length < 3) throw new Error("Couldn't find 3 open days in the next 60 days");
  return days;
};

let failures = 0;
const check = (label: string, condition: boolean, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!condition) failures++;
};

const cleanup = async () => {
  await prisma.appointment.deleteMany({ where: { serviceId: SERVICE_ID } });
  await prisma.closure.deleteMany({ where: { employeeId: { in: BARBERS } } });
  await prisma.employeeAvailability.deleteMany({ where: { employeeId: { in: BARBERS } } });
  await prisma.availability.deleteMany({ where: { id: { startsWith: P } } });
  await prisma.employee.deleteMany({ where: { id: { in: BARBERS } } });
  await prisma.service.deleteMany({ where: { id: SERVICE_ID } });
};

const setup = async () => {
  await prisma.service.create({ data: { id: SERVICE_ID, name: "Stress test", duration: 30 } });
  for (const id of BARBERS) await prisma.employee.create({ data: { id, name: id } });

  for (const day of DAYS) {
    for (const time of TIMES) {
      // Date-specific slots, so real barbers' weekly schedule is never involved
      const id = `${P}${day}_${time.replace(":", "")}`;
      await prisma.availability.create({ data: { id, day: weekdayOfKey(day), date: dateKeyToDbDate(day), time } });
      await prisma.employeeAvailability.createMany({
        data: BARBERS.map((employeeId) => ({ employeeId, availabilityId: id })),
      });
    }
  }
};

const booking = (overrides: Partial<BookAppointmentInput>): BookAppointmentInput => ({
  serviceId: SERVICE_ID,
  employeeId: BARBERS[0],
  dateKey: DAYS[0],
  time: "23:00",
  customerName: "Stress",
  customerPhone: null,
  source: "ADMIN",
  ...overrides,
});

const main = async () => {
  await cleanup(); // leftovers from an interrupted run
  DAYS = await pickTestDays();
  await setup();

  // 1. Same barber + same time, 20 requests at once: exactly one must win
  const sameSlot = await Promise.all(
    Array.from({ length: 20 }, (_, i) => bookAppointment(prisma, booking({ customerName: `race ${i}` }))),
  );
  const winners = sameSlot.filter((r) => r.ok).length;
  const saved = await prisma.appointment.count({
    where: { employeeId: BARBERS[0], date: dateKeyToDbDate(DAYS[0]), time: "23:00", status: "CONFIRMED" },
  });
  check("20 concurrent bookings of one barber+time -> exactly 1 succeeds", winners === 1, `${winners} succeeded`);
  check("...and exactly 1 row is saved", saved === 1, `${saved} rows`);
  check(
    "...the rest get SLOT_TAKEN",
    sameSlot.every((r) => r.ok || r.reason === "SLOT_TAKEN"),
  );

  // 2. "Any barber", 10 requests at once for a time where 3 barbers are free: 3 win, each a different barber
  const anyBarber = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      bookAppointment(prisma, booking({ employeeId: null, time: "23:30", customerName: `any ${i}` })),
    ),
  );
  const assigned = await prisma.appointment.findMany({
    where: { serviceId: SERVICE_ID, date: dateKeyToDbDate(DAYS[0]), time: "23:30" },
    select: { employeeId: true },
  });
  check("10 concurrent 'any barber' bookings with 3 barbers free -> 3 succeed", anyBarber.filter((r) => r.ok).length === 3);
  check("...each assigned to a different barber", new Set(assigned.map((a) => a.employeeId)).size === assigned.length && assigned.length === 3);

  // 3. Closures
  const closure = await prisma.closure.create({
    data: { employeeId: BARBERS[1], startDate: dateKeyToDbDate(DAYS[1]), endDate: dateKeyToDbDate(DAYS[1]) },
  });
  const withBarberOff = (
    await findOpenSlots(prisma, { dateKey: DAYS[1], durationMinutes: 30, employeeId: null })
  ).filter((s) => TIMES.includes(s.time)); // only the test slots; real barbers work other hours
  check(
    "Barber closure removes only that barber",
    withBarberOff.length === TIMES.length &&
      withBarberOff.every((s) => !s.employeeIds.includes(BARBERS[1]) && s.employeeIds.length === 2),
  );
  const blockedBooking = await bookAppointment(prisma, booking({ employeeId: BARBERS[1], dateKey: DAYS[1] }));
  check("Booking a barber on their day off is rejected", !blockedBooking.ok && blockedBooking.reason === "SLOT_TAKEN");
  await prisma.closure.delete({ where: { id: closure.id } });

  // A shop-wide closure also hits real barbers, so it's only checked inside a rolled-back transaction
  await prisma
    .$transaction(async (tx) => {
      await tx.closure.create({ data: { startDate: dateKeyToDbDate(DAYS[2]), endDate: dateKeyToDbDate(DAYS[2]) } });
      const shopClosed = await findOpenSlots(tx, { dateKey: DAYS[2], durationMinutes: 30, employeeId: null });
      check("Shop-wide closure leaves no open slots", shopClosed.length === 0);
      throw new Error("rollback");
    })
    .catch((error: Error) => {
      if (error.message !== "rollback") throw error;
    });

  // 4. Per-phone rules for online bookings (numbers written differently still count as one customer)
  const online = (dateKey: string, phone: string, employeeId = BARBERS[2]) =>
    bookAppointment(prisma, booking({ source: "ONLINE", employeeId, dateKey, time: "23:00", customerPhone: phone }));

  const first = await online(DAYS[1], "099 111 222");
  const sameDay = await online(DAYS[1], "+598 99 111 222", BARBERS[0]);
  const second = await online(DAYS[2], "99111222");
  const third = await online(DAYS[0], "099-111-222");
  check("Online booking with a phone succeeds", first.ok);
  check("Same phone, same day -> DUPLICATE", !sameDay.ok && sameDay.reason === "DUPLICATE");
  check("Same phone, second day -> allowed", second.ok);
  check("Same phone, third upcoming booking -> PHONE_LIMIT", !third.ok && third.reason === "PHONE_LIMIT");
  check("Phone normalization", normalizePhone("099 111 222") === "+59899111222" && normalizePhone("+54 11 5555 6666") === "+541155556666");

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
};

main()
  .catch((error) => {
    console.error(error);
    failures++;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
    process.exitCode = failures === 0 ? 0 : 1;
  });
