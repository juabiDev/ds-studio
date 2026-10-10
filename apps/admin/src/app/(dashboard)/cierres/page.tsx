import type { Metadata } from "next";

import { dbDateToKey, toShopDateKey } from "@ds-studio/database/dates";

import { ClosureForm } from "@/components/features/closures/ClosureForm";
import { DeleteClosureButton } from "@/components/features/closures/DeleteClosureButton";
import { EmptyState } from "@/components/ui/EmptyState";

import { getUpcomingClosures, type UpcomingClosure } from "@/lib/data/closures";
import { getActiveBarbers } from "@/lib/data/employees";
import { formatDateKey } from "@/lib/format";

export const metadata: Metadata = { title: "Cierres" };
export const dynamic = "force-dynamic";

const formatRange = (startDate: Date, endDate: Date) => {
  const start = dbDateToKey(startDate);
  const end = dbDateToKey(endDate);
  return start === end ? formatDateKey(start) : `${formatDateKey(start)} → ${formatDateKey(end)}`;
};

const ClosureItem = ({ closure: c }: { closure: UpcomingClosure }) => (
  <li className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
    <div>
      <p className="font-medium">{c.employee?.name ?? "Todo el local"}</p>
      <p className="text-sm">{formatRange(c.startDate, c.endDate)}</p>
      {c.reason && <p className="text-sm text-muted-foreground">{c.reason}</p>}
      {c.affected > 0 && (
        <p className="mt-1 text-sm text-amber-300">
          {c.affected} {c.affected === 1 ? "turno ya reservado" : "turnos ya reservados"} en estas fechas — revísalos en la Agenda.
        </p>
      )}
    </div>
    <DeleteClosureButton closureId={c.id} />
  </li>
);

export default async function ClosuresPage() {
  const today = toShopDateKey();
  const [barbers, closures] = await Promise.all([getActiveBarbers(), getUpcomingClosures(today)]);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Cierres</h1>
        <p className="text-sm text-muted-foreground">Feriados del local o días libres de un barbero. Nadie puede reservar en esas fechas.</p>
      </div>

      <ClosureForm barbers={barbers} minDate={today} />

      <h2 className="mt-2 font-medium">Próximos cierres</h2>
      {closures.length === 0 ? (
        <EmptyState className="p-6 text-center text-sm">No hay cierres programados.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {closures.map((c) => (
            <ClosureItem key={c.id} closure={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
