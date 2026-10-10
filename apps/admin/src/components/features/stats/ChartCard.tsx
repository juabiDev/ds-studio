import type { ReactNode } from "react";

import type { CountRow } from "@/lib/data/stats";

interface ChartCardProps {
  title: string;
  subtitle: string;
  rows: CountRow[];
  /** Header of the label column in the table view */
  labelHeader: string;
  children: ReactNode;
}

/** Card around one chart, with the same numbers as a table (for screen readers and exact values). */
export const ChartCard = ({ title, subtitle, rows, labelHeader, children }: ChartCardProps) => (
  <figure className="rounded-lg border border-border bg-card p-4">
    <figcaption>
      <h2 className="font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </figcaption>

    <div className="mt-4">{children}</div>

    <details className="mt-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
        Ver tabla
      </summary>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1 font-normal">{labelHeader}</th>
            <th className="py-1 text-right font-normal">Turnos</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="py-1.5">{r.label}</td>
              <td className="py-1.5 text-right">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  </figure>
);
