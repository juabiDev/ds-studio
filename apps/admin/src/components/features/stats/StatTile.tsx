import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@ds-studio/ui/utils";

export interface StatDelta {
  /** e.g. "+12 vs 30 días anteriores" */
  text: string;
  direction: "up" | "down" | "flat";
  /** Whether this direction is good news (fewer no-shows is good) */
  good: boolean;
}

interface StatTileProps {
  label: string;
  value: string;
  delta?: StatDelta | null;
  hint?: string;
}

export const StatTile = ({ label, value, delta, hint }: StatTileProps) => {
  const Arrow = delta?.direction === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            delta.direction === "flat" ? "text-muted-foreground" : delta.good ? "text-emerald-300" : "text-red-300",
          )}
        >
          {delta.direction !== "flat" && <Arrow size={14} aria-hidden="true" />}
          {delta.text}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};
