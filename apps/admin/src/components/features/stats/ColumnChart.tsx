import type { CountRow } from "@/lib/data/stats";

// Px height of the tallest column; the container is h-[164px] = this + room for the cap label
const CHART_HEIGHT = 140;

const turnos = (n: number) => `${n} ${n === 1 ? "turno" : "turnos"}`;

/**
 * Single-series columns from one baseline. Only the peak and the latest column carry a value on
 * the cap; every column shows its exact value on hover/focus (the whole slot is the hit target).
 */
export const ColumnChart = ({ rows, labelPrefix = "" }: { rows: CountRow[]; labelPrefix?: string }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const peakIndex = rows.findIndex((r) => r.count === max);

  return (
    <div className="flex h-[164px] items-end gap-0.5 border-b border-border">
      {rows.map((r, i) => {
        const showValue = r.count > 0 && (i === peakIndex || i === rows.length - 1);
        return (
          <div
            key={r.label}
            tabIndex={0}
            aria-label={`${labelPrefix}${r.label}: ${turnos(r.count)}`}
            className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
          >
            {/* Tooltip */}
            <span className="pointer-events-none invisible absolute -top-1 z-10 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-xs group-hover:visible group-focus-visible:visible">
              {labelPrefix}
              {r.label}: <strong className="font-semibold">{turnos(r.count)}</strong>
            </span>
            {showValue && <span className="mb-1 text-xs text-muted-foreground group-hover:invisible">{r.count}</span>}
            <span
              className="w-full max-w-6 rounded-t bg-chart-bar group-hover:opacity-80 group-focus-visible:opacity-80"
              style={{ height: Math.max(r.count > 0 ? 2 : 0, (r.count / max) * CHART_HEIGHT) }}
            />
          </div>
        );
      })}
    </div>
  );
};

/** X-axis labels under a ColumnChart, aligned to the same flex slots. */
export const ColumnLabels = ({ rows }: { rows: CountRow[] }) => (
  <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
    {rows.map((r) => (
      <span key={r.label} className="flex-1 truncate text-center text-xs text-muted-foreground">
        {r.label}
      </span>
    ))}
  </div>
);
