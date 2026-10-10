"use client";

import { useState } from "react";

import { cn } from "@ds-studio/ui/utils";

import { setShopSlotAvailability, setSlotAvailability } from "@/app/actions/schedule";

/** A barber's own slot, or the shop-wide switch that applies to every barber. */
export type SlotScope = { type: "barber"; employeeId: string } | { type: "shop" };

interface SlotToggleProps {
  scope: SlotScope;
  availabilityId: string;
  time: string;
  available: boolean;
  /** The slot is closed for the whole shop, so a barber toggle has no effect */
  shopClosed: boolean;
}

// Full-width row instead of a small switch: easy to hit with a thumb, state readable at a glance.
export const SlotToggle = ({ scope, availabilityId, time, available, shopClosed }: SlotToggleProps) => {
  const [isAvailable, setIsAvailable] = useState(available);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const locked = scope.type === "barber" && shopClosed;
  const open = isAvailable && !locked;

  const toggle = async () => {
    const next = !isAvailable;
    setIsAvailable(next); // optimistic
    setSaving(true);
    setFailed(false);

    const result =
      scope.type === "shop"
        ? await setShopSlotAvailability({ availabilityId, available: next })
        : await setSlotAvailability({ employeeId: scope.employeeId, availabilityId, available: next });

    setSaving(false);
    if (!result.ok) {
      setIsAvailable(!next);
      setFailed(true);
    }
  };

  return (
    <button
      role="switch"
      aria-checked={open}
      disabled={saving || locked}
      onClick={toggle}
      className={cn(
        "flex min-h-14 w-full items-center justify-between rounded-md border px-4 text-left transition-colors disabled:cursor-not-allowed",
        open ? "border-border bg-card" : "border-dashed border-border bg-transparent",
      )}
    >
      <span className={cn("text-lg font-semibold tabular-nums", !open && "text-muted-foreground line-through")}>{time}</span>
      <span className="flex items-center gap-3 text-sm">
        {failed && <span className="text-red-300">Error, reintenta</span>}
        {locked ? (
          <span className="text-muted-foreground">Cerrado (local)</span>
        ) : (
          <span className={cn("rounded-full px-3 py-1", open ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground")}>
            {open ? (scope.type === "shop" ? "Abierto" : "Disponible") : scope.type === "shop" ? "Cerrado" : "Bloqueado"}
          </span>
        )}
      </span>
    </button>
  );
};
