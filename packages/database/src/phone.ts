// Kept free of Prisma imports so client components can use it without bundling the DB client.

/**
 * Canonical E.164 form so "099 123 456", "99123456" and "+598 99 123 456" count as the same
 * customer. Numbers without a country code are assumed to be Uruguayan.
 */
export const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("598")) return `+${digits}`;
  return `+598${digits.replace(/^0/, "")}`;
};
