import { Check } from "lucide-react";

const STEP_LABELS = ["Servicio", "Horario", "Confirmar"];

export const StepIndicator = ({ step }: { step: number }) => (
  <ol className="flex items-center mb-12">
    {STEP_LABELS.map((label, i) => {
      const s = i + 1;
      return (
        <li key={s} className="flex items-center">
          <div
            className={`w-8 h-8 flex items-center justify-center border font-condensed text-xs tracking-wider transition-all duration-300 ${
              step > s
                ? "bg-white border-white text-black"
                : step === s
                  ? "border-white text-white"
                  : "border-white/25 text-white/50"
            }`}
          >
            {step > s ? <Check size={12} /> : s}
          </div>
          <span
            className={`font-condensed text-xs tracking-[0.2em] uppercase ml-2 mr-3 transition-colors ${
              step >= s ? "text-white" : "text-white/50"
            }`}
          >
            {label}
          </span>
          {i < 2 && <div className={`h-px w-6 sm:w-10 mr-3 ${step > s ? "bg-white" : "bg-white/15"}`} />}
        </li>
      );
    })}
  </ol>
);
