// Data minimization (Ley 18.331): customer details are only kept as long as they're useful.
// Run daily by the web app's /api/cron/retention endpoint. No "server-only" import so the
// periods can also be shown on the public privacy page.

import type { PrismaClient } from "./generated/prisma/client";
import { dateKeyToDbDate, toShopDateKey } from "./dates";

/** Name, phone and email on past appointments are anonymized after this long. */
export const CUSTOMER_DATA_RETENTION_MONTHS = 12;

/** Hashed IPs only feed the hourly booking rate limit; a month is plenty for abuse review. */
export const IP_HASH_RETENTION_DAYS = 30;

export const ANONYMIZED_CUSTOMER_NAME = "Cliente anónimo";

/** First day (shop time) whose appointments still keep customer details. */
const customerDataCutoff = (now: Date) => {
  const cutoff = dateKeyToDbDate(toShopDateKey(now));
  cutoff.setUTCMonth(cutoff.getUTCMonth() - CUSTOMER_DATA_RETENTION_MONTHS);
  return cutoff;
};

export interface RetentionSummary {
  anonymizedAppointments: number;
  clearedIpHashes: number;
  clearedMessageErrors: number;
}

/**
 * Anonymizes appointments older than the retention period. Booking history (date, service,
 * barber, status) stays for the admin stats; only what identifies the customer is removed.
 */
export const purgeExpiredCustomerData = async (prisma: PrismaClient, now = new Date()): Promise<RetentionSummary> => {
  const cutoff = customerDataCutoff(now);
  const ipCutoff = new Date(now.getTime() - IP_HASH_RETENTION_DAYS * 86_400_000);

  const [appointments, ipHashes, messageErrors] = await prisma.$transaction([
    prisma.appointment.updateMany({
      where: {
        date: { lt: cutoff },
        OR: [
          { customerName: { not: ANONYMIZED_CUSTOMER_NAME } },
          { customerPhone: { not: null } },
          { customerEmail: { not: null } },
          { actionTokenHash: { not: null } },
        ],
      },
      data: {
        customerName: ANONYMIZED_CUSTOMER_NAME,
        customerPhone: null,
        customerEmail: null,
        clientIpHash: null,
        actionTokenHash: null,
      },
    }),
    prisma.appointment.updateMany({
      where: { createdAt: { lt: ipCutoff }, clientIpHash: { not: null } },
      data: { clientIpHash: null },
    }),
    // Provider error texts can echo phone numbers or emails
    prisma.messageLog.updateMany({
      where: { createdAt: { lt: cutoff }, error: { not: null } },
      data: { error: null },
    }),
  ]);

  return {
    anonymizedAppointments: appointments.count,
    clearedIpHashes: ipHashes.count,
    clearedMessageErrors: messageErrors.count,
  };
};
