"use client";

import { createFaqItem } from "@/app/actions/faq";
import { FaqForm } from "@/components/features/faq/FaqForm";

export const NewFaqForm = () => (
  <div className="rounded-lg border border-border bg-card p-4">
    <h2 className="mb-3 font-medium">Nueva pregunta</h2>
    <FaqForm idPrefix="faq-new" submitLabel="Agregar pregunta" onSubmit={createFaqItem} resetOnSave />
  </div>
);
