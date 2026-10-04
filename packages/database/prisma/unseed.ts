// Deletes everything seed.ts created, for testing the site with an empty catalog.
// Run with `npm run db:unseed -- --yes` from the repo root; `npm run db:seed` restores it.
//
// Also deletes appointments booked with a seeded barber or service (the schema blocks deleting
// those while appointments point to them) and the site settings row. Rows created from the
// admin with their own ids (new barbers, services, photos, slots) are left alone.

import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { EMPLOYEES, GALLERY, SERVICES } from "./seed-data";

config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL");

const host = new URL(connectionString).host;
if (!process.argv.includes("--yes")) {
  console.error(`This permanently deletes the seed data (and its appointments) from ${host}.`);
  console.error("Re-run with --yes to confirm: npm run db:unseed -- --yes");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const serviceIds = SERVICES.map((s) => s.id);
const employeeIds = EMPLOYEES.map((e) => e.id);
const thumbnailIds = [
  ...EMPLOYEES.map((e) => `thumb_${e.id}`),
  ...GALLERY.map((g) => `thumb_gallery_${g.id}`),
];

const main = async () => {
  const [appointments, employees, services, gallery, thumbnails, slots, settings] = await prisma.$transaction([
    prisma.appointment.deleteMany({
      where: { OR: [{ serviceId: { in: serviceIds } }, { employeeId: { in: employeeIds } }] },
    }),
    // Cascades to their photos links, slot assignments and time off
    prisma.employee.deleteMany({ where: { id: { in: employeeIds } } }),
    prisma.service.deleteMany({ where: { id: { in: serviceIds } } }),
    prisma.galleryImage.deleteMany({ where: { id: { in: GALLERY.map((g) => `gal_${g.id}`) } } }),
    prisma.thumbnail.deleteMany({ where: { id: { in: thumbnailIds } } }),
    // Seeded slots are the only ones with "av_" ids; the admin creates them with cuids
    prisma.availability.deleteMany({ where: { id: { startsWith: "av_" } } }),
    prisma.siteSettings.deleteMany({ where: { id: 1 } }),
  ]);

  console.log(
    `Deleted from ${host}: ${appointments.count} appointments, ${employees.count} barbers, ${services.count} services, ` +
      `${gallery.count} gallery photos, ${thumbnails.count} thumbnails, ${slots.count} schedule slots, ${settings.count} site settings.`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
