"use client";

import { useEffect, useRef, useState } from "react";

import { getAdminOpenTimes } from "@/app/actions/booking";

interface UseOpenTimesInput {
  serviceId: string;
  employeeId: string;
  date: string;
  onError: (error: string) => void;
}

/**
 * Free start times for the chosen service/barber/date, plus the selected time.
 * `times` is null while loading; any change of the inputs clears the selection.
 */
export const useOpenTimes = ({ serviceId, employeeId, date, onError }: UseOpenTimesInput) => {
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  // Ref so a new callback identity doesn't trigger a refetch
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!serviceId || !employeeId || !date) return;

    let cancelled = false;
    setTimes(null);
    setTime(null);
    getAdminOpenTimes({ serviceId, employeeId, date }).then((result) => {
      if (cancelled) return;
      if (result.ok) setTimes(result.times);
      else {
        setTimes([]);
        onErrorRef.current(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serviceId, employeeId, date]);

  return { times, time, setTime };
};
