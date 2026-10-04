"use client";

import { useEffect, useRef, useState } from "react";

import type { DayOccupancy } from "@ds-studio/database/booking";

import { getMonthOccupancy } from "@/app/actions/agenda";

import { monthOf } from "@/lib/calendar";

type OccupancyByDay = Record<string, DayOccupancy>;

/**
 * Occupancy colors for the visible month, fetched only while the calendar is open.
 * `days` is null while loading. Months already fetched for this barber filter are cached,
 * so paging back and forth is instant; `clearCache` drops them when the data may be stale.
 */
export const useMonthOccupancy = ({ open, month, employeeId }: { open: boolean; month: Date; employeeId: string | null }) => {
  const [days, setDays] = useState<OccupancyByDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, OccupancyByDay>());

  useEffect(() => {
    cache.current.clear();
  }, [employeeId]);

  useEffect(() => {
    if (!open) return;

    const key = monthOf(month);
    const cached = cache.current.get(key);
    if (cached) {
      setDays(cached);
      return;
    }

    let cancelled = false;
    setDays(null);
    setError(null);
    getMonthOccupancy({ month: key, employeeId }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        cache.current.set(key, result.days);
        setDays(result.days);
      } else {
        setDays({});
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, month, employeeId]);

  const clearCache = () => cache.current.clear();

  return { days, error, clearCache };
};
