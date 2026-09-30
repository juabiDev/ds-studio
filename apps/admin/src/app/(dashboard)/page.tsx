import Link from "next/link";

import { CalendarOff, ChevronLeft, ChevronRight, MessageCircle, Phone, Plus } from "lucide-react";

import { prisma, type AppointmentStatus, type MessageStatus } from "@ds-studio/database";
import { addDaysToKey, dateKeyToDbDate, toShopDateKey } from "@ds-studio/database/dates";

import { AppointmentActions } from "@/components/features/agenda/AppointmentActions";

import { formatDateKey, whatsappLink } from "@/lib/format";
import { dateKeySchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AppointmentStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmado", className: "bg-emerald-500/15 text-emerald-300" },
  COMPLETED: { label: "Completado", className: "bg-secondary text-muted-foreground" },
  NO_SHOW: { label: "No vino", className: "bg-amber-500/15 text-amber-300" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-red-300" },
};

// Delivery state of the WhatsApp confirmation, so staff know whom to call instead
const WHATSAPP_LABEL: Partial<Record<MessageStatus, { label: string; className: string }>> = {
  SENT: { label: "WhatsApp enviado", className: "text-muted-foreground" },
  DELIVERED: { label: "WhatsApp entregado", className: "text-muted-foreground" },
  READ: { label: "WhatsApp leído", className: "text-sky-300" },
  FAILED: { label: "WhatsApp no llegó — llamar", className: "text-red-300" },
};

const dayLink =
  "flex h-11 w-11 items-center justify-center rounded-md border border-border hover:bg-secondary";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha } = await searchParams;
  const today = toShopDateKey();
  const dateKey = dateKeySchema.safeParse(fecha).success ? fecha! : today;
  const date = dateKeyToDbDate(dateKey);

  const [appointments, closures] = await Promise.all([
    prisma.appointment.findMany({
      where: { date, deletedAt: null },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        time: true,
        durationMinutes: true,
        customerName: true,
        customerPhone: true,
        status: true,
        source: true,
        customerConfirmedAt: true,
        cancelledBy: true,
        messages: {
          where: { kind: "booking_confirmation", direction: "OUTBOUND" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
        service: { select: { name: true } },
        employee: { select: { name: true } },
      },
    }),
    prisma.closure.findMany({
      where: { deletedAt: null, startDate: { lte: date }, endDate: { gte: date } },
      select: { id: true, reason: true, employee: { select: { name: true } } },
    }),
  ]);

  const active = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <section className="flex flex-col gap-5">
      {/* Day switcher */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/?fecha=${addDaysToKey(dateKey, -1)}`} className={dayLink} aria-label="Día anterior">
          <ChevronLeft size={18} />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-semibold">{dateKey === today ? "Hoy" : formatDateKey(dateKey)}</h1>
          <p className="text-sm text-muted-foreground">
            {active} {active === 1 ? "turno confirmado" : "turnos confirmados"}
          </p>
        </div>
        <Link href={`/?fecha=${addDaysToKey(dateKey, 1)}`} className={dayLink} aria-label="Día siguiente">
          <ChevronRight size={18} />
        </Link>
      </div>
      {dateKey !== today && (
        <Link href="/" className="self-center inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4">
          Volver a hoy
        </Link>
      )}

      {closures.map((c) => (
        <p key={c.id} className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <CalendarOff size={16} className="shrink-0" />
          {c.employee ? `${c.employee.name} no atiende` : "Local cerrado"}
          {c.reason ? ` · ${c.reason}` : ""}
        </p>
      ))}

      {dateKey >= today && (
        <Link
          href={`/turnos/nuevo?fecha=${dateKey}`}
          className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-base font-medium text-primary-foreground"
        >
          <Plus size={18} /> Nuevo turno
        </Link>
      )}

      {appointments.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          No hay turnos para este día.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {appointments.map((a) => {
            const status = STATUS_LABEL[a.status];
            const whatsapp = a.messages[0] ? WHATSAPP_LABEL[a.messages[0].status] : undefined;
            return (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{a.time}</p>
                    <p className="mt-1 font-medium">
                      {a.customerName}
                      {a.source === "ADMIN" && <span className="ml-2 text-xs text-muted-foreground">(cargado en el local)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.service.name} · {a.employee.name} · {a.durationMinutes} min
                    </p>
                    {a.status === "CONFIRMED" && (a.customerConfirmedAt || whatsapp) && (
                      <p className="mt-1 text-xs">
                        {a.customerConfirmedAt ? (
                          <span className="text-emerald-300">✓ El cliente confirmó asistencia</span>
                        ) : (
                          whatsapp && <span className={whatsapp.className}>{whatsapp.label}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${status.className}`}>
                    {a.status === "CANCELLED" && a.cancelledBy === "CUSTOMER" ? "Canceló el cliente" : status.label}
                  </span>
                </div>

                {a.customerPhone && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${a.customerPhone}`}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-secondary"
                    >
                      <Phone size={15} /> Llamar
                    </a>
                    <a
                      href={whatsappLink(a.customerPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-secondary"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  </div>
                )}

                {a.status === "CONFIRMED" && (
                  <div className="mt-2">
                    <AppointmentActions appointmentId={a.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
