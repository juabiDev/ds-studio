import type { Metadata } from "next";
import Link from "next/link";

import { ChevronLeft } from "lucide-react";

import { toShopDateKey } from "@ds-studio/database/dates";

import { AdminBookingForm } from "@/components/features/booking/AdminBookingForm";

import { getActiveBarbers } from "@/lib/data/employees";
import { getActiveServices } from "@/lib/data/services";
import { dateKeySchema } from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Nuevo turno" };
export const dynamic = "force-dynamic";

interface NewBookingPageProps {
  searchParams: Promise<{ fecha?: string; barbero?: string }>;
}

const PageHeader = ({ backHref }: { backHref: string }) => (
  <>
    <div className="flex items-center gap-2">
      <Link
        href={backHref}
        aria-label="Volver a la agenda"
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md hover:bg-secondary"
      >
        <ChevronLeft size={20} />
      </Link>
      <h1 className="text-xl font-semibold">Nuevo turno</h1>
    </div>
    <p className="text-sm text-muted-foreground">Para reservas por teléfono o clientes que llegan sin turno.</p>
  </>
);

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const { fecha, barbero } = await searchParams;
  const today = toShopDateKey();
  // Past or malformed dates fall back to today
  const initialDate = dateKeySchema.safeParse(fecha).success && fecha! >= today ? fecha! : today;

  const [services, barbers] = await Promise.all([getActiveServices(), getActiveBarbers()]);

  return (
    <section className="flex flex-col gap-5">
      <PageHeader backHref={`/?fecha=${initialDate}`} />

      {services.length === 0 || barbers.length === 0 ? (
        <p className="text-muted-foreground">Primero carga servicios y barberos.</p>
      ) : (
        <AdminBookingForm
          services={services}
          barbers={barbers}
          initialDate={initialDate}
          initialEmployeeId={barbers.some((b) => b.id === barbero) ? barbero! : barbers[0].id}
          minDate={today}
        />
      )}
    </section>
  );
}
