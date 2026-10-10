import type { Metadata } from "next";

import type { DayOfWeek } from "@ds-studio/database";
import { toShopDateKey, weekdayOfKey } from "@ds-studio/database/dates";

import { DayToggle } from "@/components/features/schedule/DayToggle";
import { SlotToggle, type SlotScope } from "@/components/features/schedule/SlotToggle";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { EmptyState } from "@/components/ui/EmptyState";

import { getActiveBarbers } from "@/lib/data/employees";
import { getWeekdaySlots, type WeekdaySlot } from "@/lib/data/schedule";
import { WEEKDAYS } from "@/lib/format";
import { dayOfWeekSchema } from "@/lib/validation/admin";
import type { NamedOption } from "@/types/admin";

/** `?barbero=local` edits the shop-wide switch instead of one barber */
const SHOP = "local";

export const metadata: Metadata = { title: "Horarios" };
export const dynamic = "force-dynamic";

interface SchedulePageProps {
  searchParams: Promise<{ barbero?: string; dia?: string }>;
}

const scheduleHref = (barbero: string, dia: DayOfWeek) => `/horarios?${new URLSearchParams({ barbero, dia })}`;

interface FiltersProps {
  barbers: NamedOption[];
  isShop: boolean;
  barberId: string;
  selected: string;
  day: DayOfWeek;
}

// Horizontal chip rows scroll instead of wrapping on small screens
const Filters = ({ barbers, isShop, barberId, selected, day }: FiltersProps) => (
  <>
    <ChipRow>
      <ChipLink href={scheduleHref(SHOP, day)} active={isShop}>
        Todo el local
      </ChipLink>
      {barbers.map((b) => (
        <ChipLink key={b.id} href={scheduleHref(b.id, day)} active={!isShop && b.id === barberId}>
          {b.name}
        </ChipLink>
      ))}
    </ChipRow>
    <ChipRow>
      {WEEKDAYS.map((d) => (
        <ChipLink key={d.value} href={scheduleHref(selected, d.value)} active={d.value === day}>
          {d.short}
        </ChipLink>
      ))}
    </ChipRow>
  </>
);

interface SlotListProps {
  slots: WeekdaySlot[];
  scope: SlotScope;
  selected: string;
  isAvailable: (slot: WeekdaySlot) => boolean;
}

const SlotList = ({ slots, scope, selected, isAvailable }: SlotListProps) => {
  if (slots.length === 0) {
    return <EmptyState className="p-8 text-center">No hay horarios cargados para este día.</EmptyState>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {slots.map((slot) => {
        const available = isAvailable(slot);
        return (
          <li key={slot.id}>
            {/* Keyed on the server value so a bulk day change resets the optimistic state */}
            <SlotToggle
              key={`${selected}-${slot.id}-${available}`}
              scope={scope}
              availabilityId={slot.id}
              time={slot.time}
              available={available}
              shopClosed={!slot.available}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const { barbero, dia } = await searchParams;

  const parsedDay = dayOfWeekSchema.safeParse(dia);
  const day: DayOfWeek = parsedDay.success ? parsedDay.data : weekdayOfKey(toShopDateKey());
  const dayLabel = WEEKDAYS.find((d) => d.value === day)?.short ?? "";

  // With a barber (or the shop) in the URL, load the slots alongside the barber list (one round trip).
  // The shop view only reads slot.available, so the empty per-barber join it gets is harmless.
  const requestedId = barbero || null;
  const [barbers, requestedSlots] = await Promise.all([
    getActiveBarbers(),
    requestedId ? getWeekdaySlots(day, requestedId) : null,
  ]);
  if (barbers.length === 0) {
    return <p className="text-muted-foreground">Todavía no hay barberos cargados.</p>;
  }

  const isShop = barbero === SHOP;
  const barber = barbers.find((b) => b.id === barbero) ?? barbers[0];
  const scope: SlotScope = isShop ? { type: "shop" } : { type: "barber", employeeId: barber.id };
  const selected = isShop ? SHOP : barber.id;

  // No (or unknown) barber in the URL: fall back to the first one
  const slots =
    requestedSlots && (isShop || barber.id === requestedId) ? requestedSlots : await getWeekdaySlots(day, barber.id);

  const isAvailable = (slot: WeekdaySlot) => (isShop ? slot.available : (slot.employees[0]?.available ?? false));
  const openCount = slots.filter((slot) => isAvailable(slot) && slot.available).length;

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Horarios</h1>

      <Filters barbers={barbers} isShop={isShop} barberId={barber.id} selected={selected} day={day} />

      <p className="text-sm text-muted-foreground">
        {isShop ? "Todo el local" : barber.name} · {dayLabel}: {openCount} de {slots.length} horarios abiertos.{" "}
        {isShop
          ? "Cerrar un horario acá lo cierra para todos los barberos."
          : "Toca un horario para bloquearlo o habilitarlo."}{" "}
        Para feriados o vacaciones usa Cierres.
      </p>

      {!isShop && <DayToggle employeeId={barber.id} day={day} dayLabel={dayLabel} />}

      <SlotList slots={slots} scope={scope} selected={selected} isAvailable={isAvailable} />
    </section>
  );
}
