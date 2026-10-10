"use client";

import { useState } from "react";

import { ArrowDown, ArrowUp, Pencil, X } from "lucide-react";

import { deleteFaqItem, moveFaqItem, updateFaqItem } from "@/app/actions/faq";
import { FaqForm } from "@/components/features/faq/FaqForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { IconButton } from "@/components/ui/IconButton";

import type { AdminFaqItem } from "@/lib/data/faq";

interface FaqItemCardProps {
  item: AdminFaqItem;
  isFirst: boolean;
  isLast: boolean;
}

export const FaqItemCard = ({ item, isFirst, isLast }: FaqItemCardProps) => {
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);

  const move = async (direction: "up" | "down") => {
    setMoving(true);
    const result = await moveFaqItem({ id: item.id, direction });
    setMoving(false);
    if (!result.ok) window.alert(result.error);
  };

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 pt-2">
          <p className="font-medium">{item.question}</p>
          {!editing && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{item.answer}</p>}
        </div>
        <div className="flex flex-wrap justify-end">
          <IconButton onClick={() => move("up")} disabled={isFirst || moving} aria-label="Subir">
            <ArrowUp size={18} />
          </IconButton>
          <IconButton onClick={() => move("down")} disabled={isLast || moving} aria-label="Bajar">
            <ArrowDown size={18} />
          </IconButton>
          <IconButton
            onClick={() => setEditing((v) => !v)}
            aria-label={editing ? "Cancelar edición" : "Editar pregunta"}
            aria-expanded={editing}
          >
            {editing ? <X size={18} /> : <Pencil size={18} />}
          </IconButton>
          <DeleteButton
            label="Eliminar pregunta"
            confirmMessage={`¿Eliminar «${item.question}»?`}
            onDelete={() => deleteFaqItem({ id: item.id })}
          />
        </div>
      </div>

      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <FaqForm
            idPrefix={`faq-${item.id}`}
            initial={item}
            submitLabel="Guardar cambios"
            onSubmit={(input) => updateFaqItem({ ...input, id: item.id })}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
};
