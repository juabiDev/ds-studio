import type { Metadata } from "next";

import { DEFAULT_DURATION_MINUTES } from "@ds-studio/database/booking";

import { NewServiceForm } from "@/components/features/services/NewServiceForm";
import { ServiceItem } from "@/components/features/services/ServiceItem";
import { EmptyState } from "@/components/ui/EmptyState";

import { getServicesForAdmin } from "@/lib/data/services";

export const metadata: Metadata = { title: "Servicios" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServicesForAdmin();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Servicios</h1>
        <p className="text-sm text-muted-foreground">Lo que se muestra en el sitio y se puede reservar, con su duración y precio.</p>
      </div>

      {services.length === 0 ? (
        <EmptyState className="p-6 text-center text-sm">Todavía no hay servicios.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((s) => (
            <ServiceItem key={s.id} service={s} />
          ))}
        </ul>
      )}

      <NewServiceForm defaultDuration={DEFAULT_DURATION_MINUTES} />
    </section>
  );
}
