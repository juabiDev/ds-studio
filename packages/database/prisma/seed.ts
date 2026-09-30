// Seeds the catalog the public site used to hard-code. Idempotent: re-running updates rows in place.
// Run with `npm run db:seed` from the repo root.

import { PrismaPg } from "@prisma/adapter-pg";

import { minutesToTime } from "../src/dates";
import { DEFAULT_SITE_SETTINGS } from "../src/settings";
import { PrismaClient, type DayOfWeek } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SERVICES = [
  { id: "svc_clasico", name: "Corte Clásico", duration: 45, price: 350 },
  { id: "svc_fade", name: "Fade / Degradé", duration: 50, price: 420 },
  { id: "svc_barba", name: "Barba Completa", duration: 30, price: 280 },
  { id: "svc_combo", name: "Corte + Barba", duration: 70, price: 650 },
  { id: "svc_cejas", name: "Diseño de Cejas", duration: 20, price: 180 },
  { id: "svc_tratamiento", name: "Tratamiento Capilar", duration: 40, price: 380 },
];

// TODO: replace the Unsplash stock photos with real photos of the team
const EMPLOYEES = [
  { id: "emp_diego", name: "Diego S.", role: "Fundador · Director", specialty: "Fade & Diseño", experience: "8 años", photo: "photo-1619950455147-9c450d8f988a" },
  { id: "emp_sebastian", name: "Sebastián M.", role: "Barbero Senior", specialty: "Clásico & Barba", experience: "6 años", photo: "photo-1619950466709-02c2bf682442" },
  { id: "emp_rodrigo", name: "Rodrigo T.", role: "Barbero", specialty: "Degradé & Textura", experience: "4 años", photo: "photo-1619950463968-f2bfb9341d00" },
  { id: "emp_nicolas", name: "Nicolás F.", role: "Barbero", specialty: "Corte Moderno", experience: "3 años", photo: "photo-1578176603894-57973e38890f" },
];

// Served from apps/web/public until they're moved to Cloudflare R2; then update image_url in the database
const GALLERY = [
  { id: "corte1", category: "Cortes", alt: "Corte texturizado con taper en DS STUDIO" },
  { id: "corte2", category: "Cortes", alt: "Mid fade con flequillo hacia adelante" },
  { id: "corte3", category: "Cortes", alt: "Low fade con flequillo recto" },
  { id: "hero", category: "El local", alt: "Sala de espera con el cartel de neón de DS Studio" },
  { id: "local", category: "El local", alt: "Interior de la barbería con lámpara hexagonal" },
  { id: "ubicacion", category: "El local", alt: "Fachada de DS STUDIO desde la calle" },
];

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

// Mon–Sat 9:00–20:00 with a 12:30 lunch break; Sun 10:00–15:00
const WEEKDAY_SLOTS = slotsBetween("09:00", "20:00", ["12:30"]);
const SCHEDULE: Record<DayOfWeek, string[]> = {
  MONDAY: WEEKDAY_SLOTS,
  TUESDAY: WEEKDAY_SLOTS,
  WEDNESDAY: WEEKDAY_SLOTS,
  THURSDAY: WEEKDAY_SLOTS,
  FRIDAY: WEEKDAY_SLOTS,
  SATURDAY: WEEKDAY_SLOTS,
  SUNDAY: slotsBetween("10:00", "15:00"),
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

  for (const [day, times] of Object.entries(SCHEDULE) as [DayOfWeek, string[]][]) {
    for (const time of times) {
      const id = `av_${day}_${time.replace(":", "")}`;
      await prisma.availability.upsert({ where: { id }, create: { id, day, time }, update: {} });

      // Every barber works every slot by default; admins block individual slots from the dashboard
      await prisma.employeeAvailability.createMany({
        data: EMPLOYEES.map((e) => ({ employeeId: e.id, availabilityId: id })),
        skipDuplicates: true,
      });
    }
  }

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
