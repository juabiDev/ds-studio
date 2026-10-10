import Link from "next/link";

import { CalendarOff, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { addDaysToKey, toShopDateKey } from "@ds-studio/database/dates";
import { cn } from "@ds-studio/ui/utils";

import { AgendaDatePicker } from "@/components/features/agenda/AgendaDatePicker";
import { AppointmentCard } from "@/components/features/agenda/AppointmentCard";
import { AutoRefresh } from "@/components/features/agenda/AutoRefresh";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { EmptyState } from "@/components/ui/EmptyState";

import { agendaHref, newBookingHref } from "@/lib/agenda";
import { type AgendaAppointment, type DayClosure, getDayAppointments, getDayClosures } from "@/lib/data/agenda";
import { getActiveBarbers } from "@/lib/data/employees";
import { formatDateKey, plural } from "@/lib/format";
import { dateKeySchema } from "@/lib/validation/admin";
import type { NamedOption } from "@/types/admin";

export const dynamic = "force-dynamic";

interface AgendaPageProps {
  searchParams: Promise<{ fecha?: string; barbero?: string }>;
}

const countConfirmed = (appointments: AgendaAppointment[]) =>
  appointments.filter((a) => a.status === "CONFIRMED").length;

const dayArrowClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border hover:bg-secondary";

interface DaySwitcherProps {
  dateKey: string;
  today: string;
  employeeId: string | null;
  confirmed: number;
}

const DaySwitcher = ({ dateKey, today, employeeId, confirmed }: DaySwitcherProps) => (
  <>
    {/* Tapping the date opens the occupancy calendar */}
    <div className="flex items-center justify-between gap-3">
      <Link href={agendaHref(addDaysToKey(dateKey, -1), employeeId)} className={dayArrowClass} aria-label="Día anterior">
        <ChevronLeft size={18} />
      </Link>
      <div className="flex flex-col items-center text-center">
        <AgendaDatePicker
          dateKey={dateKey}
          label={dateKey === today ? "Hoy" : formatDateKey(dateKey)}
          employeeId={employeeId}
        />
        <p className="text-sm text-muted-foreground">
          {confirmed} {confirmed === 1 ? "turno confirmado" : "turnos confirmados"}
        </p>
      </div>
      <Link href={agendaHref(addDaysToKey(dateKey, 1), employeeId)} className={dayArrowClass} aria-label="Día siguiente">
        <ChevronRight size={18} />
      </Link>
    </div>
    {dateKey !== today && (
      <Link
        href={agendaHref(today, employeeId)}
        className="inline-flex min-h-11 items-center self-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a hoy
      </Link>
    )}
  </>
);

interface BarbersProps {
  barbers: NamedOption[];
  dateKey: string;
  employeeId: string | null;
}

const Barbers = ({ barbers, dateKey, employeeId }: BarbersProps) => {
  if (barbers.length <= 1) return null;

  return (
    <ChipRow className="md:mx-0 md:px-0">
      <ChipLink href={agendaHref(dateKey, null)} active={!employeeId}>
        Todos
      </ChipLink>
      {barbers.map((b) => (
        <ChipLink key={b.id} href={agendaHref(dateKey, b.id)} active={b.id === employeeId}>
          {b.name}
        </ChipLink>
      ))}
    </ChipRow>
  );
};

const ClosureNotices = ({ closures }: { closures: DayClosure[] }) =>
  closures.map((c) => (
    <p
      key={c.id}
      className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
    >
      <CalendarOff size={16} className="shrink-0" />
      {c.employee ? `${c.employee.name} no atiende` : "Local cerrado"}
      {c.reason ? ` · ${c.reason}` : ""}
    </p>
  ));

const NewAppointmentLink = ({ dateKey, employeeId }: { dateKey: string; employeeId: string | null }) => (
  <Link
    href={newBookingHref(dateKey, employeeId)}
    className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-base font-medium text-primary-foreground md:self-end md:px-6"
  >
    <Plus size={18} /> Nuevo turno
  </Link>
);

const BarberColumn = ({ barber, appointments }: { barber: NamedOption; appointments: AgendaAppointment[] }) => (
  <div className="flex flex-col gap-3">
    <h2 className="flex items-baseline justify-between border-b border-border pb-2 font-medium">
      {barber.name}
      <span className="text-sm font-normal text-muted-foreground">{plural(countConfirmed(appointments), "confirmado", "confirmados")}</span>
    </h2>
    {appointments.length === 0 ? (
      <EmptyState className="p-6 text-center text-sm">Sin turnos</EmptyState>
    ) : (
      <ul className="flex flex-col gap-3">
        {appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} showBarber={false} />
        ))}
      </ul>
    )}
  </div>
);

interface AppointmentsProps {
  appointments: AgendaAppointment[];
  barbers: NamedOption[];
  employeeId: string | null;
}

const Appointments = ({ appointments, barbers, employeeId }: AppointmentsProps) => {
  if (appointments.length === 0) {
    return <EmptyState className="p-8 text-center">No hay turnos para este día.</EmptyState>;
  }

  // Desktop shows one column per barber when looking at everyone
  const showColumns = !employeeId && barbers.length > 1;

  return (
    <>
      {/* Chronological list: always on mobile, and on desktop when filtered to one barber */}
      <ul className={cn("flex flex-col gap-3", showColumns ? "md:hidden" : "md:grid md:grid-cols-2")}>
        {appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} showBarber={!employeeId} />
        ))}
      </ul>

      {showColumns && (
        <div className="hidden gap-4 overflow-x-auto pb-2 md:grid md:auto-cols-[minmax(17rem,1fr)] md:grid-flow-col">
          {barbers.map((b) => (
            <BarberColumn key={b.id} barber={b} appointments={appointments.filter((a) => a.employeeId === b.id)} />
          ))}
        </div>
      )}
    </>
  );
};

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const { fecha, barbero } = await searchParams;
  const today = toShopDateKey();
  const dateKey = dateKeySchema.safeParse(fecha).success ? fecha! : today;

  // Fetch everything in one round trip, trusting the URL's barber; validated right after
  const requestedId = barbero || null;
  const loadDay = (id: string | null) => Promise.all([getDayAppointments(dateKey, id), getDayClosures(dateKey, id)]);
  const [barbers, requestedDay] = await Promise.all([getActiveBarbers(), loadDay(requestedId)]);

  // Unknown ids (e.g. a deleted barber in an old link) fall back to "all", at the cost of a refetch
  const employeeId = barbers.some((b) => b.id === requestedId) ? requestedId : null;
  const [appointments, closures] = employeeId === requestedId ? requestedDay : await loadDay(null);

  return (
    <section className="flex flex-col gap-5">
      <AutoRefresh />
      <DaySwitcher dateKey={dateKey} today={today} employeeId={employeeId} confirmed={countConfirmed(appointments)} />
      <Barbers barbers={barbers} dateKey={dateKey} employeeId={employeeId} />
      <ClosureNotices closures={closures} />
      {dateKey >= today && <NewAppointmentLink dateKey={dateKey} employeeId={employeeId} />}
      <Appointments appointments={appointments} barbers={barbers} employeeId={employeeId} />
    </section>
  );
}
