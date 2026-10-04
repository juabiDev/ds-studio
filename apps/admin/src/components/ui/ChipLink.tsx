import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@ds-studio/ui/utils";

interface ChipLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
}

/** Pill-shaped filter link; rows of these scroll horizontally on small screens. */
export const ChipLink = ({ href, active, children }: ChipLinkProps) => (
  <Link
    href={href}
    className={cn(
      "inline-flex min-h-11 flex-shrink-0 items-center rounded-full border px-4 text-sm",
      active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary",
    )}
  >
    {children}
  </Link>
);

/** Horizontally scrolling container for a row of ChipLinks. */
export const ChipRow = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1", className)}>{children}</div>
);
