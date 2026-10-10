"use client";

import { useState } from "react";

import { Pencil, X } from "lucide-react";

import { deleteService, updateService } from "@/app/actions/services";
import { ServiceForm } from "@/components/features/services/ServiceForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { IconButton } from "@/components/ui/IconButton";

import type { AdminService } from "@/lib/data/services";

export const ServiceItem = ({ service }: { service: AdminService }) => {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground">
            {service.duration} min · {service.price != null ? `$${service.price}` : "Consultar"}
          </p>
        </div>
        <div className="flex">
          <IconButton
            onClick={() => setEditing((v) => !v)}
            aria-label={editing ? "Cancelar edición" : `Editar ${service.name}`}
            aria-expanded={editing}
          >
            {editing ? <X size={18} /> : <Pencil size={18} />}
          </IconButton>
          <DeleteButton
            label={`Eliminar ${service.name}`}
            confirmMessage={`¿Eliminar «${service.name}»? Deja de aparecer en el sitio; los turnos ya reservados se mantienen.`}
            onDelete={() => deleteService({ id: service.id })}
          />
        </div>
      </div>

      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <ServiceForm
            idPrefix={`svc-${service.id}`}
            initial={service}
            submitLabel="Guardar cambios"
            onSubmit={(input) => updateService({ ...input, id: service.id })}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
};
