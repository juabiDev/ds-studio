import type { Metadata } from "next";
import Link from "next/link";

import { prisma, type DayOfWeek } from "@ds-studio/database";
import { toShopDateKey, weekdayOfKey } from "@ds-studio/database/dates";

import { DayToggle } from "@/components/features/schedule/DayToggle";
import { SlotToggle, type SlotScope } from "@/components/features/schedule/SlotToggle";

import { WEEKDAYS } from "@/lib/format";
import { dayOfWeekSchema } from "@/lib/validation/admin";

/** `?barbero=local` edits the shop-wide switch instead of one barber */
const SHOP = "local";

export const metadata: Metadata = { title: "Horarios" };
export const dynamic = "force-dynamic";

const chip = (active: boolean) =>
  `flex-shrink-0 inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${
    active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"
  }`;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ barbero?: string; dia?: string }>;
}) {
  const { barbero, dia } = await searchParams;

  const barbers = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (barbers.length === 0) {
    return <p className="text-muted-foreground">Todavía no hay barberos cargados.</p>;
  }

  const isShop = barbero === SHOP;
  const barber = barbers.find((b) => b.id === barbero) ?? barbers[0];
  const scope: SlotScope = isShop ? { type: "shop" } : { type: "barber", employeeId: barber.id };
  const selected = isShop ? SHOP : barber.id;
  const parsedDay = dayOfWeekSchema.safeParse(dia);
  const day: DayOfWeek = parsedDay.success ? parsedDay.data : weekdayOfKey(toShopDateKey());
  const dayLabel = WEEKDAYS.find((d) => d.value === day)?.short ?? "";

  // All recurring slots for the weekday, joined with this barber's assignment (if any)
  const slots = await prisma.availability.findMany({
    where: { day, date: null, deletedAt: null },
    orderBy: { time: "asc" },
    select: {
      id: true,
      time: true,
      available: true,
      employees: { where: { employeeId: barber.id }, select: { available: true } },
    },
  });

  const href = (params: { barbero?: string; dia?: string }) =>
    `/horarios?${new URLSearchParams({ barbero: params.barbero ?? selected, dia: params.dia ?? day })}`;

  const isOpen = (slot: (typeof slots)[number]) =>
    isShop ? slot.available : slot.available && (slot.employees[0]?.available ?? false);
  const openCount = slots.filter(isOpen).length;

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Horarios</h1>

      {/* Horizontal chip rows scroll instead of wrapping on small screens */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ barbero: SHOP })} className={chip(isShop)}>
          Todo el local
        </Link>
        {barbers.map((b) => (
          <Link key={b.id} href={href({ barbero: b.id })} className={chip(!isShop && b.id === barber.id)}>
            {b.name}
          </Link>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {WEEKDAYS.map((d) => (
          <Link key={d.value} href={href({ dia: d.value })} className={chip(d.value === day)}>
            {d.short}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {isShop ? "Todo el local" : barber.name} · {dayLabel}: {openCount} de {slots.length} horarios abiertos.{" "}
        {isShop
          ? "Cerrar un horario acá lo cierra para todos los barberos."
          : "Tocá un horario para bloquearlo o habilitarlo."}{" "}
        Para feriados o vacaciones usá Cierres.
      </p>

      {!isShop && <DayToggle employeeId={barber.id} day={day} dayLabel={dayLabel} />}

      {slots.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          No hay horarios cargados para este día.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => {
            const available = isShop ? slot.available : (slot.employees[0]?.available ?? false);
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
      )}
    </section>
  );
}
