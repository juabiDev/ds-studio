"use client";

import { useEffect, useState } from "react";

import { shopNowMinutes, timeToMinutes, toShopDateKey, weekdayOfKey } from "@ds-studio/database/dates";
import type { OpeningHoursByDay } from "@ds-studio/database/settings";

// Computed after mount: the page is statically cached, so "now" must come from the visitor's clock.
export const OpenStatus = ({ hours }: { hours: OpeningHoursByDay }) => {
  const [status, setStatus] = useState<{ open: boolean; closes?: string } | null>(null);

  useEffect(() => {
    const today = hours[weekdayOfKey(toShopDateKey())];
    const now = shopNowMinutes();
    const open = !!today && now >= timeToMinutes(today.opens) && now < timeToMinutes(today.closes);
    setStatus({ open, closes: today?.closes });
  }, [hours]);

  if (!status) return null;

  return (
    <p className="inline-flex items-center gap-2 font-condensed text-xs tracking-[0.25em] uppercase text-white/80">
      <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-400" : "bg-white/40"}`} />
      {status.open ? `Abierto ahora · cierra ${status.closes}` : "Cerrado ahora · reserva online"}
    </p>
  );
};
