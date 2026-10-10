// Classes shared by the booking wizard steps.

export const optionClass = (selected: boolean) =>
  `border transition-all duration-200 ${selected ? "border-white bg-white/5" : "border-white/15 hover:border-white/40"}`;

// Site-wide button looks, re-exported so the wizard keeps one import
export { primaryButton, secondaryButton } from "@/lib/button-styles";

export const sectionLabel = "font-condensed text-white/65 text-xs tracking-[0.35em] uppercase mb-4";

export const textInput =
  "min-h-12 bg-card border border-white/15 text-white placeholder:text-white/50 px-5 font-body text-base focus:border-white/60 focus:outline-none transition-colors";
