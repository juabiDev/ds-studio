import { z } from "zod";

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
  name: z.string().trim().min(2, "Ingresá el nombre del cliente").max(80),
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
