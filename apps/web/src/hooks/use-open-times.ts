"use client";

import { useEffect, useState } from "react";

import { fetchOpenTimes } from "@/lib/availability";

interface UseOpenTimesInput {
  /** Only fetch while the schedule step is visible */
  enabled: boolean;
  serviceId: string | null;
  barberChoice: string;
  dateKey: string | null;
}

/**
 * Live free times for the chosen service/barber/date. `times` is null while loading;
 * `setTimes` lets the caller apply a fresher list from a re-check.
 */
export const useOpenTimes = ({ enabled, serviceId, barberChoice, dateKey }: UseOpenTimesInput) => {
  const [times, setTimes] = useState<string[] | null>(null);
  const [timesError, setTimesError] = useState(false);

  useEffect(() => {
    if (!enabled || !serviceId || !dateKey) return;

    const controller = new AbortController();

    setTimes(null);
    setTimesError(false);
    fetchOpenTimes({ serviceId, barberChoice, dateKey }, controller.signal)
      .then(setTimes)
      .catch(() => {
        if (!controller.signal.aborted) setTimesError(true);
      });

    return () => controller.abort();
  }, [enabled, serviceId, barberChoice, dateKey]);

  return { times, setTimes, timesError };
};
