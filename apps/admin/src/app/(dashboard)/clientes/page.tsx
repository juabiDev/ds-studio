import type { Metadata } from "next";

import { Mail, MessageCircle, Phone, Search } from "lucide-react";

import { CUSTOMER_DATA_RETENTION_MONTHS } from "@ds-studio/database/retention";
import { cn } from "@ds-studio/ui/utils";

import { EmptyState } from "@/components/ui/EmptyState";

import { searchCustomers, type CustomerHistory } from "@/lib/data/customers";
import { fieldClass } from "@/lib/form-styles";
import { formatDateKey, STATUS_LABEL, whatsappLink } from "@/lib/format";
import { customerSearchSchema } from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

/** Repeat no-shows are worth a heads-up before confirming another booking. */
const NO_SHOW_WARNING = 2;

const contactLink = "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-secondary";

const CustomerCard = ({ customer: c }: { customer: CustomerHistory }) => {
  const visited = c.counts.COMPLETED + c.counts.NO_SHOW;

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-sm text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ") || "Sin contacto"}</p>
        </div>
        {c.counts.NO_SHOW >= NO_SHOW_WARNING && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300">
            Faltó {c.counts.NO_SHOW} veces
          </span>
        )}
      </div>

      <p className="mt-2 text-sm">
        {c.counts.COMPLETED} {c.counts.COMPLETED === 1 ? "visita" : "visitas"}
        {visited > 0 && ` · faltó ${c.counts.NO_SHOW} de ${visited}`}
        {c.counts.CANCELLED > 0 && ` · ${c.counts.CANCELLED} cancelados`}
        {c.counts.CONFIRMED > 0 && ` · ${c.counts.CONFIRMED} próximos`}
      </p>

      {(c.phone || c.email) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.phone && (
            <>
              <a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" className={contactLink}>
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a href={`tel:${c.phone}`} className={contactLink}>
                <Phone size={15} /> Llamar
              </a>
            </>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className={contactLink}>
              <Mail size={15} /> Email
            </a>
          )}
        </div>
      )}

      <details className="mt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
          Ver historial ({c.visits.length})
        </summary>
        <ul className="mt-1 flex flex-col divide-y divide-border">
          {c.visits.map((v) => {
            const badge = STATUS_LABEL[v.status];
            return (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p>
                    {formatDateKey(v.dateKey)} · {v.time}
                  </p>
                  <p className="text-muted-foreground">
                    {v.serviceName} con {v.barberName}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs", badge.className)}>{badge.label}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
};

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = customerSearchSchema.safeParse(q);
  const customers = query.success ? await searchCustomers(query.data) : null;

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Busca por teléfono o nombre para ver visitas, faltas y cancelaciones. Los datos se anonimizan a los{" "}
          {CUSTOMER_DATA_RETENTION_MONTHS} meses del turno.
        </p>
      </div>

      <form role="search" className="flex gap-2">
        <label htmlFor="customer-q" className="sr-only">Teléfono o nombre</label>
        <input
          id="customer-q"
          name="q"
          type="search"
          defaultValue={q}
          minLength={3}
          maxLength={60}
          placeholder="099 123 456 o Juan"
          autoComplete="off"
          className={fieldClass}
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <Search size={18} />
        </button>
      </form>

      {customers === null ? (
        q && <p className="text-sm text-muted-foreground">Escribe al menos 3 caracteres.</p>
      ) : customers.length === 0 ? (
        <EmptyState className="p-6 text-center text-sm">No encontramos clientes con «{q}».</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((c) => (
            <CustomerCard key={c.key} customer={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
