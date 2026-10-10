import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@ds-studio/database";
import { purgeExpiredCustomerData } from "@ds-studio/database/retention";

import { bearerAuthFailure } from "@/lib/bearer-auth";

export const dynamic = "force-dynamic";

/** Daily anonymization of old customer data, run by the same Railway cron service as the reminders. */
const handler = async (request: NextRequest) => {
  const failure = bearerAuthFailure(request, process.env.CRON_SECRET);
  if (failure) return new NextResponse(null, { status: failure });

  try {
    const summary = await purgeExpiredCustomerData(prisma);
    console.info("[cron/retention]", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[cron/retention]", error);
    return NextResponse.json({ error: "Retention run failed" }, { status: 500 });
  }
};

export const GET = handler;
export const POST = handler;
