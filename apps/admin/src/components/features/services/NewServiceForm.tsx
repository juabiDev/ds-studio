"use client";

import { createService } from "@/app/actions/services";
import { ServiceForm } from "@/components/features/services/ServiceForm";

// Blank form; the duration starts at the shop's default slot length
export const NewServiceForm = ({ defaultDuration }: { defaultDuration: number }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <h2 className="mb-3 font-medium">Nuevo servicio</h2>
    <ServiceForm
      idPrefix="svc-new"
      initial={{ name: "", duration: defaultDuration, price: null }}
      submitLabel="Agregar servicio"
      onSubmit={createService}
      resetOnSave
    />
  </div>
);
