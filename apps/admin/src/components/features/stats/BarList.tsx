import { cn } from "@ds-studio/ui/utils";

import type { CountRow } from "@/lib/data/stats";

/** How many of the largest bars get their value printed at the tip; the rest show it on hover. */
const LABELED = 3;

const turnos = (n: number) => `${n} ${n === 1 ? "turno" : "turnos"}`;

/** Horizontal single-series bars, one row per label (e.g. each start time). */
export const BarList = ({ rows }: { rows: CountRow[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const labeled = new Set(
    [...rows]
      .sort((a, b) => b.count - a.count)
      .slice(0, LABELED)
      .filter((r) => r.count > 0)
      .map((r) => r.label),
  );

  return (
    <ul className="flex flex-col">
      {rows.map((r) => (
        <li
          key={r.label}
          tabIndex={0}
          aria-label={`${r.label}: ${turnos(r.count)}`}
          className="group relative grid min-h-7 grid-cols-[3rem_1fr] items-center gap-2 rounded outline-none hover:bg-secondary/40 focus-visible:bg-secondary/40"
        >
          <span className="text-xs tabular-nums text-muted-foreground">{r.label}</span>
          <span className="flex items-center gap-2 border-l border-border">
            <span
              className="h-3 rounded-r bg-chart-bar"
              style={{ width: `${(r.count / max) * 85}%`, minWidth: r.count > 0 ? 2 : 0 }}
            />
            <span
              className={cn(
                "text-xs text-muted-foreground",
                !labeled.has(r.label) && "invisible group-hover:visible group-focus-visible:visible",
              )}
            >
              {r.count}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};
