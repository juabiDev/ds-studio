-- Neighborhood + postal code for the address (local SEO), and an admin-editable FAQ with an on/off switch.

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "show_faq" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_sort_order_idx" ON "faq_items"("sort_order");

-- Starting questions; edited from the admin afterwards
INSERT INTO "faq_items" ("id", "question", "answer", "sort_order", "updated_at") VALUES
('faq_sin_turno', '¿Puedo ir sin turno?', 'Sí, atendemos sin turno si hay un barbero libre. Reservando online te aseguras el horario.', 0, CURRENT_TIMESTAMP),
('faq_pagos', '¿Qué medios de pago aceptan?', 'Efectivo, tarjetas de débito y crédito, transferencia bancaria y Mercado Pago.', 1, CURRENT_TIMESTAMP),
('faq_ninos', '¿Cortan a niños?', 'Sí. Reserva el turno como cualquier otro corte.', 2, CURRENT_TIMESTAMP),
('faq_cancelar', '¿Cómo cancelo o cambio mi turno?', 'Puedes cancelar desde el link del email de confirmación hasta 2 horas antes. Para cambiar el horario, o si falta menos, escríbenos por WhatsApp.', 3, CURRENT_TIMESTAMP),
('faq_duracion', '¿Cuánto dura cada servicio?', 'La duración aproximada figura en cada servicio. Llega unos minutos antes para empezar a tiempo.', 4, CURRENT_TIMESTAMP);
