import { Plus } from "lucide-react";

import { SectionHeading } from "@/components/features/home/SectionHeading";

import type { FaqEntry } from "@/types/site";

// Native <details>: opens and closes without client JS. Renders nothing when the admin
// turned the section off or there are no questions.
export const FaqSection = ({ entries }: { entries: FaqEntry[] }) => {
  if (!entries.length) return null;

  return (
    <section id="preguntas" className="py-20 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <SectionHeading eyebrow="Antes de venir" title="Preguntas frecuentes" />

        <div className="border-t border-white/10">
          {entries.map((entry) => (
            <details key={entry.id} className="group border-b border-white/10">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="font-display font-bold text-foreground text-lg">{entry.question}</h3>
                <Plus
                  size={18}
                  aria-hidden="true"
                  className="flex-shrink-0 text-white/60 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              {/* whitespace-pre-line keeps the line breaks typed in the admin */}
              <p className="font-body text-white/70 leading-relaxed pb-6 pr-10 whitespace-pre-line">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
