import { z } from "zod";

import { optionalText } from "@ds-studio/database/settings";

const id = z.string().min(1).max(64);

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const dayOfWeekSchema = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);

export const appointmentStatusSchema = z.object({
  appointmentId: id,
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
});

export const monthOccupancySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  employeeId: id.nullable(),
});

export const slotAvailabilitySchema = z.object({
  employeeId: id,
  availabilityId: id,
  available: z.boolean(),
});

export const dayAvailabilitySchema = z.object({
  employeeId: id,
  day: dayOfWeekSchema,
  available: z.boolean(),
});

const optionalPhone = z
  .string()
  .trim()
  .regex(/^(\+?[\d\s-]{8,20})?$/, "Teléfono inválido")
  .transform((v) => v || null);

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.union([z.literal(""), z.email("Email inválido")]))
  .transform((v) => v || null);

export const adminOpenTimesSchema = z.object({
  serviceId: id,
  employeeId: id,
  date: dateKeySchema,
});

export const adminBookingSchema = z.object({
  serviceId: id,
  employeeId: id,
  date: dateKeySchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  name: z.string().trim().min(2, "Ingresa el nombre del cliente").max(80),
  phone: optionalPhone,
  email: optionalEmail,
});

export const closureSchema = z
  .object({
    employeeId: id.nullable(),
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    reason: z.string().trim().max(120).optional(),
  })
  .refine((c) => c.startDate <= c.endDate, { message: "La fecha de fin no puede ser anterior al inicio." });

export const closureIdSchema = z.object({ closureId: id });

export const shopSlotSchema = z.object({ availabilityId: id, available: z.boolean() });

/** First validation message, for actions that answer with a single error line. */
export const firstIssue = (error: z.ZodError, fallback = "Datos inválidos.") => error.issues[0]?.message ?? fallback;

/** Moves one row of an ordered list (FAQ, gallery) one step up or down. */
export const moveSchema = z.object({ id, direction: z.enum(["up", "down"]) });

export const idSchema = z.object({ id });

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del servicio").max(60),
  duration: z.number({ error: "Ingresa la duración" }).int().min(5, "Mínimo 5 minutos").max(480, "Máximo 8 horas"),
  // null = "Consultar" on the site
  price: z.number().min(0, "El precio no puede ser negativo").max(1_000_000).nullable(),
});

export const faqItemSchema = z.object({
  question: z.string().trim().min(5, "Escribe la pregunta").max(160, "Máximo 160 caracteres"),
  answer: z.string().trim().min(2, "Escribe la respuesta").max(1500, "Máximo 1500 caracteres"),
});

export const faqVisibilitySchema = z.object({ visible: z.boolean() });

export const barberProfileSchema = z.object({
  employeeId: id,
  name: z.string().trim().min(2, "Ingresa el nombre").max(60),
  role: z.string().trim().min(2, "Ingresa el rol").max(40),
  specialty: optionalText(60),
  experience: optionalText(30),
});

/** Cloudflare Images ids are UUIDs (or custom ids); nothing else is accepted from the client. */
export const cloudflareImageIdSchema = z.string().regex(/^[\w-]{8,100}$/);

export const imageUploadRequestSchema = z.object({ purpose: z.enum(["gallery", "barber"]) });

export const galleryImageSchema = z.object({
  category: z.string().trim().min(2, "Ingresa una categoría").max(30, "Máximo 30 caracteres"),
  alt: z.string().trim().min(5, "Describe la foto (ayuda a Google y a lectores de pantalla)").max(140),
});

export const newGalleryImageSchema = galleryImageSchema.extend({ imageId: cloudflareImageIdSchema });

export const barberPhotoSchema = z.object({ employeeId: id, imageId: cloudflareImageIdSchema });

export const customerSearchSchema = z.string().trim().min(3).max(60);
