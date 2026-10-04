// Client-side helpers for the public availability endpoint (app/api/availability).

/** Barber choice meaning "cualquiera": the server assigns the first free barber. */
export const ANY_BARBER = "any";

export const fetchOpenTimes = async (
  params: { serviceId: string; barberChoice: string; dateKey: string },
  signal?: AbortSignal,
): Promise<string[]> => {
  const query = new URLSearchParams({ date: params.dateKey, serviceId: params.serviceId });
  if (params.barberChoice !== ANY_BARBER) query.set("employeeId", params.barberChoice);

  const res = await fetch(`/api/availability?${query}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`availability ${res.status}`);
  return ((await res.json()) as { times: string[] }).times;
};
