"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";
import { DEFAULT_SITE_SETTINGS } from "@ds-studio/database/settings";
import { SITE_SETTINGS_ID } from "@ds-studio/database/settings-store";

import { moveInList } from "@/lib/reorder";
import { faqItemSchema, faqVisibilitySchema, firstIssue, idSchema, moveSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

export interface FaqItemInput {
  question: string;
  answer: string;
}

/** Shows or hides the whole FAQ section on the public site. */
export const setFaqVisibility = async (input: { visible: boolean }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = faqVisibilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      // First write before Ajustes was ever saved: start from the defaults the site already shows
      create: { id: SITE_SETTINGS_ID, ...DEFAULT_SITE_SETTINGS, showFaq: parsed.data.visible },
      update: { showFaq: parsed.data.visible },
    });
  } catch (error) {
    console.error("[setFaqVisibility]", error);
    return { ok: false, error: "No se pudo guardar." };
  }

  revalidatePath("/preguntas");
  return { ok: true };
};

export const createFaqItem = async (input: FaqItemInput): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = faqItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    // New questions go last
    const last = await prisma.faqItem.aggregate({ where: { deletedAt: null }, _max: { sortOrder: true } });
    await prisma.faqItem.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  } catch (error) {
    console.error("[createFaqItem]", error);
    return { ok: false, error: "No se pudo agregar la pregunta." };
  }

  revalidatePath("/preguntas");
  return { ok: true };
};

export const updateFaqItem = async (input: FaqItemInput & { id: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsedId = idSchema.safeParse(input);
  const parsed = faqItemSchema.safeParse(input);
  if (!parsedId.success) return { ok: false, error: "Datos inválidos." };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const { count } = await prisma.faqItem.updateMany({ where: { id: parsedId.data.id, deletedAt: null }, data: parsed.data });
    if (count === 0) return { ok: false, error: "Esa pregunta ya no existe." };
  } catch (error) {
    console.error("[updateFaqItem]", error);
    return { ok: false, error: "No se pudo guardar la pregunta." };
  }

  revalidatePath("/preguntas");
  return { ok: true };
};

export const moveFaqItem = async (input: { id: string; direction: "up" | "down" }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const rows = await prisma.faqItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const order = moveInList(rows.map((r) => r.id), parsed.data.id, parsed.data.direction);
    if (!order) return { ok: true };

    await prisma.$transaction(order.map((id, sortOrder) => prisma.faqItem.update({ where: { id }, data: { sortOrder } })));
  } catch (error) {
    console.error("[moveFaqItem]", error);
    return { ok: false, error: "No se pudo mover la pregunta." };
  }

  revalidatePath("/preguntas");
  return { ok: true };
};

/** Soft delete. With no questions left the section simply doesn't render on the site. */
export const deleteFaqItem = async (input: { id: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    await prisma.faqItem.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date() } });
  } catch (error) {
    console.error("[deleteFaqItem]", error);
    return { ok: false, error: "No se pudo eliminar la pregunta." };
  }

  revalidatePath("/preguntas");
  return { ok: true };
};
