import type { Metadata } from "next";

import { BarList } from "@/components/features/stats/BarList";
import { ChartCard } from "@/components/features/stats/ChartCard";
import { ColumnChart, ColumnLabels } from "@/components/features/stats/ColumnChart";
import { StatTile, type StatDelta } from "@/components/features/stats/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";

import { getShopStats } from "@/lib/data/stats";

export const metadata: Metadata = { title: "Estadísticas" };
export const dynamic = "force-dynamic";

const VS = "vs 30 días anteriores";

const money = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
const percent = (ratio: number | null) => (ratio === null ? "—" : `${Math.round(ratio * 100)}%`);

/** Difference between two counts; `upIsGood` sets the color. */
const countDelta = (now: number, before: number, upIsGood: boolean, format = (n: number) => String(n)): StatDelta => {
  const diff = now - before;
  if (diff === 0) return { text: `Igual ${VS}`, direction: "flat", good: true };
  return {
    text: `${diff > 0 ? "+" : "−"}${format(Math.abs(diff))} ${VS}`,
    direction: diff > 0 ? "up" : "down",
    good: diff > 0 === upIsGood,
  };
};

/** Difference between two rates, in percentage points. */
const rateDelta = (now: number | null, before: number | null, upIsGood: boolean): StatDelta | null => {
  if (now === null || before === null) return null;
  const points = Math.round((now - before) * 100);
  if (points === 0) return { text: `Igual ${VS}`, direction: "flat", good: true };
  return {
    text: `${points > 0 ? "+" : "−"}${Math.abs(points)} pts ${VS}`,
    direction: points > 0 ? "up" : "down",
    good: points > 0 === upIsGood,
  };
};

export default async function StatsPage() {
  const { current, previous, weekly, byHour, byWeekday, byBarber } = await getShopStats();
  const hasData = weekly.some((w) => w.count > 0);

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 30 días. Las faltas e ingresos cuentan solo los turnos marcados como «Completado» o «No vino» en la Agenda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Turnos" value={String(current.bookings)} delta={countDelta(current.bookings, previous.bookings, true)} />
        <StatTile
          label="Ingresos estimados"
          value={money.format(current.revenue)}
          delta={countDelta(current.revenue, previous.revenue, true, (n) => money.format(n))}
          hint="Con los precios actuales"
        />
        <StatTile
          label="Tasa de faltas"
          value={percent(current.noShowRate)}
          delta={rateDelta(current.noShowRate, previous.noShowRate, false)}
          hint={`${current.noShows} de ${current.completed + current.noShows} turnos atendidos`}
        />
        <StatTile
          label="Reservas online"
          value={percent(current.onlineShare)}
          hint={`${current.cancelled} ${current.cancelled === 1 ? "cancelación" : "cancelaciones"}`}
        />
      </div>

      {!hasData ? (
        <EmptyState className="p-6 text-center text-sm">Todavía no hay turnos en las últimas 8 semanas.</EmptyState>
      ) : (
        <>
          <ChartCard title="Turnos por semana" subtitle="Últimas 8 semanas, sin cancelados. La última es la semana en curso." rows={weekly} labelHeader="Semana del">
            <ColumnChart rows={weekly} labelPrefix="Semana del " />
            <ColumnLabels rows={weekly} />
          </ChartCard>

          <div className="grid gap-5 md:grid-cols-2">
            <ChartCard title="Días más pedidos" subtitle="Turnos por día de la semana, últimas 8 semanas." rows={byWeekday} labelHeader="Día">
              <ColumnChart rows={byWeekday} />
              <ColumnLabels rows={byWeekday} />
            </ChartCard>

            <ChartCard title="Horarios más pedidos" subtitle="Turnos por hora de inicio, últimas 8 semanas." rows={byHour} labelHeader="Hora">
              <BarList rows={byHour} />
            </ChartCard>
          </div>
        </>
      )}

      {byBarber.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">Por barbero</h2>
          <p className="text-sm text-muted-foreground">Últimos 30 días.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-normal">Barbero</th>
                <th className="py-1 text-right font-normal">Atendidos</th>
                <th className="py-1 text-right font-normal">Faltas</th>
                <th className="py-1 text-right font-normal">Ingresos</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {byBarber.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="py-2">{b.name}</td>
                  <td className="py-2 text-right">{b.completed}</td>
                  <td className="py-2 text-right">{b.noShows}</td>
                  <td className="py-2 text-right">{money.format(b.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
