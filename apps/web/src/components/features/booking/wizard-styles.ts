// Classes shared by the booking wizard steps.

export const optionClass = (selected: boolean) =>
  `border transition-all duration-200 ${selected ? "border-white bg-white/5" : "border-white/15 hover:border-white/40"}`;

export const primaryButton =
  "flex-1 md:flex-none inline-flex items-center justify-center gap-2 min-h-12 bg-white text-black font-condensed tracking-[0.25em] uppercase text-xs px-8 disabled:opacity-30 hover:bg-white/90 transition-all";

export const secondaryButton =
  "inline-flex items-center justify-center min-h-12 border border-white/25 text-white/70 font-condensed tracking-[0.25em] uppercase text-xs px-6 hover:border-white/50 hover:text-white transition-all";

export const sectionLabel = "font-condensed text-white/65 text-xs tracking-[0.35em] uppercase mb-4";

export const textInput =
  "min-h-12 bg-card border border-white/15 text-white placeholder:text-white/50 px-5 font-body text-base focus:border-white/60 focus:outline-none transition-colors";
