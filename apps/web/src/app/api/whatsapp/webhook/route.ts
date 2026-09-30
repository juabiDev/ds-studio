import { after, NextResponse, type NextRequest } from "next/server";

import { dateKeyToDbDate } from "@ds-studio/database/dates";
import { handleWhatsAppWebhook, verifyWebhookSubscription } from "@ds-studio/messaging/webhook";

import { MONTH_NAMES } from "@/lib/home-content";
import { notifyCustomerCancellation } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET: one-time handshake when the URL is registered in the Meta app dashboard
export const GET = (request: NextRequest) => {
  const challenge = verifyWebhookSubscription(request.nextUrl.searchParams);
  if (challenge === null) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
};

// POST: button taps and delivery statuses. The raw body is read as text because the
// signature is computed over the exact bytes Meta sent.
export const POST = async (request: NextRequest) => {
  const rawBody = await request.text();

  try {
    const result = await handleWhatsAppWebhook(rawBody, request.headers.get("x-hub-signature-256"));
    if (result.status !== 200) return new NextResponse(null, { status: result.status });

    if (result.cancellations.length > 0) {
      after(() =>
        Promise.all(
          result.cancellations.map((c) => {
            const d = dateKeyToDbDate(c.dateKey);
            return notifyCustomerCancellation({
              customerName: c.customerName,
              customerPhone: c.customerPhone,
              serviceName: c.serviceName,
              barberName: c.barberName,
              dateLabel: `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`,
              time: c.time,
            });
          }),
        ),
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    // 500 makes Meta retry; the handler already removed the dedupe row for the failed message
    console.error("[whatsapp webhook]", error);
    return new NextResponse(null, { status: 500 });
  }
};
