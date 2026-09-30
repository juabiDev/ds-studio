import type { Metadata } from "next";

import { prisma } from "@ds-studio/database";
import { dateKeyToDbDate, dbDateToKey, toShopDateKey } from "@ds-studio/database/dates";

import { ClosureForm } from "@/components/features/closures/ClosureForm";
import { DeleteClosureButton } from "@/components/features/closures/DeleteClosureButton";

import { formatDateKey } from "@/lib/format";

export const metadata: Metadata = { title: "Cierres" };
export const dynamic = "force-dynamic";

export default async function ClosuresPage() {
  const today = toShopDateKey();

  const [barbers, closures] = await Promise.all([
    prisma.employee.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    prisma.closure.findMany({
      where: { deletedAt: null, endDate: { gte: dateKeyToDbDate(today) } },
      orderBy: { startDate: "asc" },
      select: { id: true, employeeId: true, startDate: true, endDate: true, reason: true, employee: { select: { name: true } } },
    }),
  ]);

  // Bookings made before the closure still exist: surface them so staff can call those customers
  const affected = await Promise.all(
    closures.map((c) =>
      prisma.appointment.count({
        where: {
          deletedAt: null,
          status: "CONFIRMED",
          date: { gte: c.startDate, lte: c.endDate },
          ...(c.employeeId ? { employeeId: c.employeeId } : {}),
        },
      }),
    ),
  );

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Cierres</h1>
        <p className="text-sm text-muted-foreground">Feriados del local o días libres de un barbero. Nadie puede reservar en esas fechas.</p>
      </div>

      <ClosureForm barbers={barbers} minDate={today} />

      <h2 className="mt-2 font-medium">Próximos cierres</h2>
      {closures.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay cierres programados.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {closures.map((c, i) => {
            const start = dbDateToKey(c.startDate);
            const end = dbDateToKey(c.endDate);
            return (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{c.employee?.name ?? "Todo el local"}</p>
                  <p className="text-sm">
                    {start === end ? formatDateKey(start) : `${formatDateKey(start)} → ${formatDateKey(end)}`}
                  </p>
                  {c.reason && <p className="text-sm text-muted-foreground">{c.reason}</p>}
                  {affected[i] > 0 && (
                    <p className="mt-1 text-sm text-amber-300">
                      {affected[i]} {affected[i] === 1 ? "turno ya reservado" : "turnos ya reservados"} en estas fechas — revisalos en la Agenda.
                    </p>
                  )}
                </div>
                <DeleteClosureButton closureId={c.id} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
