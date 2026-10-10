"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

import type { ActionResult } from "@/types/admin";

interface DeleteButtonProps {
  /** Shown in a native confirm dialog before deleting */
  confirmMessage: string;
  label: string;
  onDelete: () => Promise<ActionResult>;
}

/** Trash icon with confirmation; only used inside client components (onDelete is a closure). */
export const DeleteButton = ({ confirmMessage, label, onDelete }: DeleteButtonProps) => {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    const result = await onDelete();
    setPending(false);
    if (!result.ok) window.alert(result.error);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-red-300 disabled:opacity-50"
    >
      <Trash2 size={18} />
    </button>
  );
};
