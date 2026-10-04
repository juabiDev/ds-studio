// Seeds the catalog the public site used to hard-code. Idempotent: re-running updates rows in place.
// Run with `npm run db:seed` from the repo root.

import { PrismaPg } from "@prisma/adapter-pg";

import { minutesToTime } from "../src/dates";
import { DEFAULT_SITE_SETTINGS } from "../src/settings";
import { PrismaClient, type DayOfWeek } from "../src/generated/prisma/client";
import { EMPLOYEES, GALLERY, SERVICES } from "./seed-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const unsplash = (photo: string, w: number, h: number) =>
  `https://images.unsplash.com/${photo}?w=${w}&h=${h}&fit=crop&auto=format`;

/** Every 30 min from `from` (inclusive) to `to` (exclusive), skipping `breaks`. */
const slotsBetween = (from: string, to: string, breaks: string[] = []) => {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const times: string[] = [];
  for (let m = fh * 60 + fm; m < th * 60 + tm; m += 30) times.push(minutesToTime(m));
  return times.filter((t) => !breaks.includes(t));
};

// Mon–Fri 10:00–20:00 with a 12:30 lunch break; Sat 9:00–14:00; Sun 10:00–14:00
const WEEKDAY_SLOTS = slotsBetween("10:00", "20:00", ["12:30"]);
const SCHEDULE: Record<DayOfWeek, string[]> = {
  MONDAY: WEEKDAY_SLOTS,
  TUESDAY: WEEKDAY_SLOTS,
  WEDNESDAY: WEEKDAY_SLOTS,
  THURSDAY: WEEKDAY_SLOTS,
  FRIDAY: WEEKDAY_SLOTS,
  SATURDAY: slotsBetween("9:00", "14:00"),
  SUNDAY: slotsBetween("10:00", "14:00"),
};

const main = async () => {
  for (const s of SERVICES) {
    const data = { name: s.name, duration: s.duration, price: s.price };
    await prisma.service.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }

  for (const e of EMPLOYEES) {
    const thumbnailId = `thumb_${e.id}`;
    const thumbnail = {
      imageUrl: unsplash(e.photo, 600, 800),
      variants: { sm: unsplash(e.photo, 96, 96), md: unsplash(e.photo, 600, 800) },
      defaultVariant: "md",
      alt: e.name,
    };
    await prisma.thumbnail.upsert({ where: { id: thumbnailId }, create: { id: thumbnailId, ...thumbnail }, update: thumbnail });

    const employee = { name: e.name, role: e.role, specialty: e.specialty, experience: e.experience };
    await prisma.employee.upsert({ where: { id: e.id }, create: { id: e.id, ...employee }, update: employee });
    await prisma.employeeImage.createMany({ data: [{ employeeId: e.id, thumbnailId }], skipDuplicates: true });
  }

  for (const [index, g] of GALLERY.entries()) {
    const thumbnailId = `thumb_gallery_${g.id}`;
    const thumbnail = { imageUrl: `/images/${g.id}.jpg`, alt: g.alt };
    await prisma.thumbnail.upsert({ where: { id: thumbnailId }, create: { id: thumbnailId, ...thumbnail }, update: thumbnail });

    const item = { thumbnailId, category: g.category, sortOrder: index };
    const id = `gal_${g.id}`;
    await prisma.galleryImage.upsert({ where: { id }, create: { id, ...item }, update: item });
  }

  // Only created once: never overwrite what the owner saved from the admin
  await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...DEFAULT_SITE_SETTINGS }, update: {} });

  // Bulk inserts instead of one round-trip per slot: ~230 queries down to 2 against a remote DB
  const slots = (Object.entries(SCHEDULE) as [DayOfWeek, string[]][]).flatMap(([day, times]) =>
    times.map((time) => ({ id: `av_${day}_${time.replace(":", "")}`, day, time })),
  );
  await prisma.availability.createMany({ data: slots, skipDuplicates: true });

  // Every barber works every slot by default; admins block individual slots from the dashboard
  await prisma.employeeAvailability.createMany({
    data: slots.flatMap((slot) => EMPLOYEES.map((e) => ({ employeeId: e.id, availabilityId: slot.id }))),
    skipDuplicates: true,
  });

  console.log(
    `Seeded ${SERVICES.length} services, ${EMPLOYEES.length} barbers, ${GALLERY.length} gallery photos, site settings and the weekly schedule.`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
