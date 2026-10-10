import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/lib/site-config";

// Building blocks shared by /privacidad and /terminos, so both legal pages look the same.

export const LegalPage = ({ title, updated, children }: { title: string; updated: string; children: ReactNode }) => (
  <main className="min-h-dvh bg-background px-6 py-16">
    <article className="max-w-2xl mx-auto">
      <Link href="/" className="font-display text-white text-xl font-bold tracking-[0.3em]">
        {SITE_NAME}
      </Link>

      <h1 className="font-display font-bold text-white text-4xl md:text-5xl mt-10">{title}</h1>
      <p className="font-condensed text-white/60 text-sm tracking-wider mt-3">Última actualización: {updated}</p>

      {children}

      <Link
        href="/"
        className="inline-flex items-center mt-12 min-h-12 border border-white/40 px-8 font-condensed text-white/85 tracking-[0.25em] uppercase text-sm hover:border-white/70 hover:text-white transition-all"
      >
        Volver al inicio
      </Link>
    </article>
  </main>
);

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10">
    <h2 className="font-display font-bold text-white text-2xl mb-3">{title}</h2>
    <div className="font-body text-white/75 leading-relaxed flex flex-col gap-3">{children}</div>
  </section>
);

export const LegalList = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 flex flex-col gap-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

/** Inline link inside legal text; external links open in a new tab. */
export const LegalLink = ({ href, children }: { href: string; children: ReactNode }) => {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className="text-white underline underline-offset-4"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
};
