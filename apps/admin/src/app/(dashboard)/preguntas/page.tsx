import type { Metadata } from "next";

import { FaqItemCard } from "@/components/features/faq/FaqItemCard";
import { FaqVisibilityToggle } from "@/components/features/faq/FaqVisibilityToggle";
import { NewFaqForm } from "@/components/features/faq/NewFaqForm";
import { EmptyState } from "@/components/ui/EmptyState";

import { getFaqForAdmin } from "@/lib/data/faq";

export const metadata: Metadata = { title: "Preguntas frecuentes" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const { items, visible } = await getFaqForAdmin();

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Preguntas frecuentes</h1>
        <p className="text-sm text-muted-foreground">Las preguntas que aparecen en el sitio, en este orden.</p>
      </div>

      <FaqVisibilityToggle visible={visible} hasItems={items.length > 0} />

      {items.length === 0 ? (
        <EmptyState className="p-6 text-center text-sm">No hay preguntas cargadas.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <FaqItemCard key={item.id} item={item} isFirst={i === 0} isLast={i === items.length - 1} />
          ))}
        </ul>
      )}

      <NewFaqForm />
    </section>
  );
}
