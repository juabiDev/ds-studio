import "server-only";

import { prisma, type DayOfWeek } from "@ds-studio/database";

/** All recurring slots for the weekday, joined with this barber's assignment (if any). */
export const getWeekdaySlots = (day: DayOfWeek, employeeId: string) =>
  prisma.availability.findMany({
    where: { day, date: null, deletedAt: null },
    orderBy: { time: "asc" },
    select: {
      id: true,
      time: true,
      available: true,
      employees: { where: { employeeId }, select: { available: true } },
    },
  });

export type WeekdaySlot = Awaited<ReturnType<typeof getWeekdaySlots>>[number];
