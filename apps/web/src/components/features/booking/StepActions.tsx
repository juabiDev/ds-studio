import type { ReactNode } from "react";

/** Primary/secondary actions: pinned to the bottom of the screen on mobile, inline on desktop. */
export const StepActions = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex gap-3 border-t border-white/10 bg-background/95 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
    {children}
  </div>
);
