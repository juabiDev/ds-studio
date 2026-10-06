-- Customer email for booking confirmations and same-day reminders.

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "customer_email" TEXT;
