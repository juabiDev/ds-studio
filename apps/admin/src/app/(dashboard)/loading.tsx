// Shown on every tab change while the server queries the DB, so a slow connection still gets instant feedback
export default function DashboardLoading() {
  return (
    <section aria-busy="true" aria-label="Cargando" className="flex animate-pulse flex-col gap-5">
      <div className="mx-auto h-7 w-40 rounded-md bg-secondary" />
      <div className="h-12 rounded-md bg-secondary" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-36 rounded-lg border border-border bg-card" />
      ))}
    </section>
  );
}
