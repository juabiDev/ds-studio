import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario inválido");
const id = z.string().min(1).max(64);

export const availabilityQuerySchema = z.object({
  date: dateKey,
  serviceId: id,
  employeeId: id.nullish(),
});

export const bookingSchema = z.object({
  serviceId: id,
  employeeId: id.nullable(),
  date: dateKey,
  time,
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  // Uruguayan mobiles are 09x xxx xxx; accept +598, spaces and dashes
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,20}$/, "Ingresa un teléfono válido"),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Ingresa un email válido")),
  /** Honeypot: hidden from people, so it must stay empty */
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(2048).optional(),
});

/** Self-service cancel link from the emails: appointment id + 128-bit HMAC (base64url, 22 chars). */
export const cancelLinkSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{1,64}$/i),
  t: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
});
