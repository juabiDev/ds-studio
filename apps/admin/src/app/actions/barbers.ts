"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";

import { getUploadedImage } from "@/lib/cloudflare-images";
import { barberPhotoSchema, barberProfileSchema, firstIssue } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

export interface BarberProfileInput {
  employeeId: string;
  name: string;
  role: string;
  specialty: string;
  experience: string;
}

const revalidate = (employeeId: string) => {
  revalidatePath("/barberos");
  revalidatePath(`/barberos/${employeeId}`);
};

export const updateBarberProfile = async (input: BarberProfileInput): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = barberProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { employeeId, ...data } = parsed.data;

  try {
    const { count } = await prisma.employee.updateMany({ where: { id: employeeId, deletedAt: null }, data });
    if (count === 0) return { ok: false, error: "Ese barbero ya no existe." };
  } catch (error) {
    console.error("[updateBarberProfile]", error);
    return { ok: false, error: "No se pudieron guardar los datos." };
  }

  revalidate(employeeId);
  return { ok: true };
};

/** Step 2 of an upload: the new photo becomes the barber's profile picture (lowest sortOrder). */
export const setBarberPhoto = async (input: { employeeId: string; imageId: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = barberPhotoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const employee = await prisma.employee.findFirst({
      where: { id: parsed.data.employeeId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return { ok: false, error: "Ese barbero ya no existe." };

    const image = await getUploadedImage(parsed.data.imageId, "barber");
    if (!image) return { ok: false, error: "No encontramos la foto subida. Intenta subirla de nuevo." };

    const first = await prisma.employeeImage.aggregate({
      where: { employeeId: parsed.data.employeeId },
      _min: { sortOrder: true },
    });

    await prisma.thumbnail.create({
      data: {
        // No stored alt: the site builds it from the current name and role, so a rename never leaves it stale
        ...image,
        employees: {
          create: { employeeId: parsed.data.employeeId, sortOrder: (first._min.sortOrder ?? 1) - 1 },
        },
      },
    });
  } catch (error) {
    console.error("[setBarberPhoto]", error);
    return { ok: false, error: "No se pudo guardar la foto." };
  }

  revalidate(parsed.data.employeeId);
  return { ok: true };
};
