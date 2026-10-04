// Client-safe URL helpers, shared by server links and the client date picker.

/** Agenda URL keeping the barber filter. */
export const agendaHref = (dateKey: string, employeeId: string | null) => {
  const params = new URLSearchParams({ fecha: dateKey });
  if (employeeId) params.set("barbero", employeeId);
  return `/?${params}`;
};

/** New-booking form prefilled with the agenda's date and barber filter. */
export const newBookingHref = (dateKey: string, employeeId: string | null) => {
  const params = new URLSearchParams({ fecha: dateKey });
  if (employeeId) params.set("barbero", employeeId);
  return `/turnos/nuevo?${params}`;
};
