"use client";

import { useState, type FormEvent } from "react";

import { ArrowDown, ArrowUp, Pencil, X } from "lucide-react";

import { deleteGalleryImage, moveGalleryImage, updateGalleryImage } from "@/app/actions/gallery";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { IconButton } from "@/components/ui/IconButton";

import type { AdminGalleryPhoto } from "@/lib/data/gallery";
import { fieldClass, labelClass, submitClass } from "@/lib/form-styles";

interface GalleryItemCardProps {
  photo: AdminGalleryPhoto;
  categories: string[];
  isFirst: boolean;
  isLast: boolean;
}

export const GalleryItemCard = ({ photo, categories, isFirst, isLast }: GalleryItemCardProps) => {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(photo.category);
  const [alt, setAlt] = useState(photo.alt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = async (direction: "up" | "down") => {
    setPending(true);
    const result = await moveGalleryImage({ id: photo.id, direction });
    setPending(false);
    if (!result.ok) window.alert(result.error);
  };

  const toggleEditing = () => {
    // Closing discards unsaved edits, so reopening starts from the saved values
    if (editing) {
      setCategory(photo.category);
      setAlt(photo.alt);
      setError(null);
    }
    setEditing(!editing);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateGalleryImage({ id: photo.id, category, alt });
    setPending(false);
    if (result.ok) setEditing(false);
    else setError(result.error);
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail from Cloudflare or the public site */}
        <img src={photo.src} alt={photo.alt} loading="lazy" className="aspect-[3/4] w-20 shrink-0 rounded-md bg-secondary object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{photo.category}</p>
          <p className="line-clamp-3 text-sm text-muted-foreground">{photo.alt || "Sin descripción"}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <IconButton onClick={() => move("up")} disabled={isFirst || pending} aria-label="Mover antes">
          <ArrowUp size={18} />
        </IconButton>
        <IconButton onClick={() => move("down")} disabled={isLast || pending} aria-label="Mover después">
          <ArrowDown size={18} />
        </IconButton>
        <IconButton onClick={toggleEditing} aria-label={editing ? "Cancelar edición" : "Editar foto"} aria-expanded={editing}>
          {editing ? <X size={18} /> : <Pencil size={18} />}
        </IconButton>
        <DeleteButton
          label="Eliminar foto"
          confirmMessage="¿Sacar esta foto de la galería?"
          onDelete={() => deleteGalleryImage({ id: photo.id })}
        />
      </div>

      {editing && (
        <form onSubmit={handleSave} className="flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <label htmlFor={`cat-${photo.id}`} className={labelClass}>Categoría</label>
            <input
              id={`cat-${photo.id}`}
              list={`cats-${photo.id}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={30}
              className={fieldClass}
            />
            <datalist id={`cats-${photo.id}`}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor={`alt-${photo.id}`} className={labelClass}>Descripción</label>
            <input id={`alt-${photo.id}`} value={alt} onChange={(e) => setAlt(e.target.value)} required maxLength={140} className={fieldClass} />
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={pending} className={submitClass}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </li>
  );
};
