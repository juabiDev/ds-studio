import "server-only";

import { prisma, type AppointmentStatus, type Prisma } from "@ds-studio/database";
import { dbDateToKey } from "@ds-studio/database/dates";
import { ANONYMIZED_CUSTOMER_NAME } from "@ds-studio/database/retention";

/** Enough history for any one customer; a broad name search just shows the most recent. */
const MAX_APPOINTMENTS = 300;

export interface CustomerVisit {
  id: string;
  dateKey: string;
  time: string;
  status: AppointmentStatus;
  serviceName: string;
  barberName: string;
}

export interface CustomerHistory {
  /** Phone when there is one, otherwise the lowercased name (walk-ins added without phone) */
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  visits: CustomerVisit[];
  counts: Record<AppointmentStatus, number>;
}

/**
 * Phone digits match anywhere in the stored E.164 number; a leading 0 is dropped so the local
 * "099 123 456" finds "+59899123456". Otherwise it's a case-insensitive name search.
 */
const searchFilter = (query: string): Prisma.AppointmentWhereInput => {
  const digits = query.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length >= 6) return { customerPhone: { contains: digits } };
  return { customerName: { contains: query, mode: "insensitive" } };
};

const emptyCounts = (): Record<AppointmentStatus, number> => ({ CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 });

/** Appointments matching the search, grouped per customer, most recent visit first. */
export const searchCustomers = async (query: string): Promise<CustomerHistory[]> => {
  const rows = await prisma.appointment.findMany({
    // AND, not a spread: the name search also filters customerName and would replace the exclusion
    where: { deletedAt: null, AND: [{ customerName: { not: ANONYMIZED_CUSTOMER_NAME } }, searchFilter(query)] },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: MAX_APPOINTMENTS,
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      service: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });

  const customers = new Map<string, CustomerHistory>();

  for (const row of rows) {
    const key = row.customerPhone ?? `name:${row.customerName.trim().toLowerCase()}`;
    let customer = customers.get(key);
    if (!customer) {
      // Rows are newest first, so the first one seen carries the latest name/email
      customer = { key, name: row.customerName, phone: row.customerPhone, email: row.customerEmail, visits: [], counts: emptyCounts() };
      customers.set(key, customer);
    }
    customer.email ??= row.customerEmail;
    customer.counts[row.status] += 1;
    customer.visits.push({
      id: row.id,
      dateKey: dbDateToKey(row.date),
      time: row.time,
      status: row.status,
      serviceName: row.service.name,
      barberName: row.employee.name,
    });
  }

  return [...customers.values()];
};
