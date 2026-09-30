import type { Metadata } from "next";
import Link from "next/link";

import { ChevronLeft } from "lucide-react";

import { prisma } from "@ds-studio/database";
import { toShopDateKey } from "@ds-studio/database/dates";

import { AdminBookingForm } from "@/components/features/booking/AdminBookingForm";

import { dateKeySchema } from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Nuevo turno" };
export const dynamic = "force-dynamic";

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha } = await searchParams;
  const today = toShopDateKey();
  const initialDate = dateKeySchema.safeParse(fecha).success && fecha! >= today ? fecha! : today;

  const [services, barbers] = await Promise.all([
    prisma.service.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    prisma.employee.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          href={`/?fecha=${initialDate}`}
          aria-label="Volver a la agenda"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md hover:bg-secondary"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold">Nuevo turno</h1>
      </div>
      <p className="text-sm text-muted-foreground">Para reservas por teléfono o clientes que llegan sin turno.</p>

      {services.length === 0 || barbers.length === 0 ? (
        <p className="text-muted-foreground">Primero cargá servicios y barberos.</p>
      ) : (
        <AdminBookingForm services={services} barbers={barbers} initialDate={initialDate} minDate={today} />
      )}
    </section>
  );
}
