import type { Metadata } from "next";
import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { MORE_NAV } from "@/lib/navigation";

export const metadata: Metadata = { title: "Más" };

export default function MorePage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Más</h1>
      <ul className="flex flex-col gap-2">
        {MORE_NAV.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-16 items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-secondary">
              <Icon size={20} className="shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block font-medium">{label}</span>
                {description && <span className="block text-sm text-muted-foreground">{description}</span>}
              </span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
