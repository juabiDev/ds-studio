import type { ComponentProps } from "react";

import { cn } from "@ds-studio/ui/utils";

/** 44px square icon button (thumb-sized); always pass an aria-label. */
export const IconButton = ({ className, type = "button", ...props }: ComponentProps<"button"> & { "aria-label": string }) => (
  <button
    type={type}
    className={cn(
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
      className,
    )}
    {...props}
  />
);
