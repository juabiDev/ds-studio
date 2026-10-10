import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@ds-studio/database";
import { DEFAULT_DURATION_MINUTES, findOpenSlots, isDateInBookingWindow } from "@ds-studio/database/booking";

import { createRateLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/spam";
import { availabilityQuerySchema } from "@/lib/validation/booking";

// A customer clicking through dates makes a few dozen requests at most; each one queries the database
const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// GET /api/availability?date=YYYY-MM-DD&serviceId=...&employeeId=... → { times: ["09:00", ...] }
export const GET = async (request: NextRequest) => {
  const ip = await getClientIp();
  if (ip && limiter.isLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas consultas. Espera un minuto." }, { status: 429 });
  }

  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || !isDateInBookingWindow(parsed.data.date)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { date, serviceId, employeeId } = parsed.data;

  try {
    const service = await prisma.service.findFirst({ where: { id: serviceId, deletedAt: null } });
    if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

    const slots = await findOpenSlots(prisma, {
      dateKey: date,
      durationMinutes: service.duration ?? DEFAULT_DURATION_MINUTES,
      employeeId: employeeId ?? null,
    });

    return NextResponse.json(
      { times: slots.map((s) => s.time) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[availability]", error);
    return NextResponse.json({ error: "No pudimos cargar los horarios" }, { status: 500 });
  }
};
