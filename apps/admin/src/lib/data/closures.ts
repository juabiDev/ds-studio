import "server-only";

import { prisma } from "@ds-studio/database";
import { dateKeyToDbDate } from "@ds-studio/database/dates";

/** Closures that haven't ended yet, each with how many confirmed bookings fall inside it. */
export const getUpcomingClosures = async (todayKey: string) => {
  const closures = await prisma.closure.findMany({
    where: { deletedAt: null, endDate: { gte: dateKeyToDbDate(todayKey) } },
    orderBy: { startDate: "asc" },
    select: { id: true, employeeId: true, startDate: true, endDate: true, reason: true, employee: { select: { name: true } } },
  });

  // Bookings made before the closure still exist: surface them so staff can call those customers
  const affected = await Promise.all(
    closures.map((c) =>
      prisma.appointment.count({
        where: {
          deletedAt: null,
          status: "CONFIRMED",
          date: { gte: c.startDate, lte: c.endDate },
          ...(c.employeeId ? { employeeId: c.employeeId } : {}),
        },
      }),
    ),
  );

  return closures.map((c, i) => ({ ...c, affected: affected[i] }));
};

export type UpcomingClosure = Awaited<ReturnType<typeof getUpcomingClosures>>[number];
