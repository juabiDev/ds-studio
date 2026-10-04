import type { ReactNode } from "react";

import { cn } from "@ds-studio/ui/utils";

/** Dashed placeholder box for empty lists. Padding/size vary per context, so they come via className. */
export const EmptyState = ({ className, children }: { className?: string; children: ReactNode }) => (
  <p className={cn("rounded-md border border-dashed border-border text-muted-foreground", className)}>{children}</p>
);
