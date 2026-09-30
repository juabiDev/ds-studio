"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

import { deleteClosure } from "@/app/actions/closures";

export const DeleteClosureButton = ({ closureId }: { closureId: string }) => {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (!window.confirm("¿Eliminar este cierre? Los horarios vuelven a quedar reservables.")) return;
    setPending(true);
    const result = await deleteClosure({ closureId });
    setPending(false);
    if (!result.ok) window.alert(result.error);
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label="Eliminar cierre"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-red-300 disabled:opacity-50"
    >
      <Trash2 size={18} />
    </button>
  );
};
