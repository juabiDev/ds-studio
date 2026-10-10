"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { cn } from "@ds-studio/ui/utils";

import { updateSiteSettings } from "@/app/actions/settings";

import { submitClass } from "@/lib/form-styles";

// Client island for the settings form: submit + save status. The fields arrive as server-rendered children.
export const SettingsFormShell = ({ children }: { children: ReactNode }) => {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const result = await updateSiteSettings(new FormData(event.currentTarget));
    setSaving(false);
    setStatus(
      result.ok
        ? { ok: true, message: "Guardado. El sitio ya muestra los cambios." }
        : { ok: false, message: result.error },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {children}

      {status && (
        <p role={status.ok ? "status" : "alert"} className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
          {status.message}
        </p>
      )}

      <button type="submit" disabled={saving} className={submitClass}>
        {saving ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
};
