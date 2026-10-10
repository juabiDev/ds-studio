import type { Metadata } from "next";

import { BOOKING_WINDOW_DAYS, MAX_ACTIVE_BOOKINGS_PER_PHONE } from "@ds-studio/database/booking";
import { ONLINE_CANCEL_CUTOFF_MINUTES } from "@ds-studio/messaging/email";

import { LegalLink, LegalList, LegalPage, LegalSection } from "@/components/features/legal/LegalPage";

import { getBusinessInfo } from "@/lib/data/business";
import { LEGAL_ENTITY, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de las reservas online de ${SITE_NAME}: precios, cancelaciones, tolerancia y reclamos.`,
  alternates: { canonical: "/terminos" },
  openGraph: {
    title: `Términos y condiciones — ${SITE_NAME}`,
    description: `Condiciones de las reservas online de ${SITE_NAME}.`,
    url: "/terminos",
    siteName: SITE_NAME,
    locale: "es_UY",
    type: "website",
  },
};

// Contact details come from the admin settings; refreshed on each admin save (and every 5 minutes)
export const revalidate = 300;

const LAST_UPDATED = "10 de octubre de 2026";

/** Minutes late before the turn may be given to someone else. */
const LATE_TOLERANCE_MINUTES = 10;

const CANCEL_CUTOFF_HOURS = ONLINE_CANCEL_CUTOFF_MINUTES / 60;

// Written to cover the information duties of Ley 17.250 and Decreto 167/021 (MERCOSUR e-commerce):
// who the provider is, prices with taxes, conditions of the offer, confirmation and complaints.
export default async function TermsPage() {
  const business = await getBusinessInfo();
  const address = [business.address.street, business.address.neighborhood, business.address.city].filter(Boolean).join(", ");
  const emailLink = <LegalLink href={`mailto:${business.email}`}>{business.email}</LegalLink>;
  const whatsappLink = <LegalLink href={business.whatsappUrl}>WhatsApp</LegalLink>;

  return (
    <LegalPage title="Términos y condiciones" updated={LAST_UPDATED}>
      <LegalSection title="Quiénes somos">
        <p>
          {SITE_NAME} es el nombre comercial de {LEGAL_ENTITY.name}, RUT {LEGAL_ENTITY.rut}, con domicilio en {address},
          Uruguay. Puedes contactarnos por email a {emailLink}, por teléfono al{" "}
          <LegalLink href={business.phone.href}>{business.phone.display}</LegalLink> o por {whatsappLink}.
        </p>
      </LegalSection>

      <LegalSection title="Reservas online">
        <LegalList
          items={[
            "Reservar es gratis: no cobramos nada por adelantado. El servicio se paga en el local.",
            `Puedes reservar con hasta ${BOOKING_WINDOW_DAYS} días de anticipación, en los horarios que se muestran disponibles.`,
            "Antes de confirmar ves un resumen con el servicio, el barbero, la fecha y la hora. El turno queda reservado cuando confirmas y ves el mensaje «¡Turno reservado!»; además te enviamos la confirmación por email.",
            `Cada teléfono puede tener hasta ${MAX_ACTIVE_BOOKINGS_PER_PHONE} turnos reservados a la vez y uno por día.`,
            "Te pedimos datos reales: podemos anular reservas falsas o hechas de forma automática.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Precios y pagos">
        <p>
          Los precios publicados están en pesos uruguayos e incluyen IVA. Los servicios marcados «Consultar» se cotizan en
          el local. La duración de cada servicio es aproximada.
        </p>
        <p>Aceptamos efectivo, tarjetas de débito y crédito, transferencia bancaria y Mercado Pago.</p>
      </LegalSection>

      <LegalSection title="Llegada y tolerancia">
        <p>
          Te pedimos que llegues unos minutos antes. Si llegas más de {LATE_TOLERANCE_MINUTES} minutos tarde, el turno puede
          perderse y el horario asignarse a otra persona.
        </p>
      </LegalSection>

      <LegalSection title="Cancelaciones y cambios">
        <LegalList
          items={[
            `Puedes cancelar sin costo desde el link del email de confirmación hasta ${CANCEL_CUTOFF_HOURS} horas antes del turno.`,
            `Para cambiar el horario, o si faltan menos de ${CANCEL_CUTOFF_HOURS} horas, escríbenos por WhatsApp o llámanos.`,
            "Si por un imprevisto tenemos que cancelar tu turno, te avisamos por email o teléfono y te ofrecemos otro horario.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Consultas y reclamos">
        <p>
          Atendemos consultas y reclamos por email a {emailLink}, por {whatsappLink} o en el local, y te respondemos a la
          brevedad. Tus derechos como consumidor están protegidos por la Ley N° 17.250 de Defensa del Consumidor; si no
          quedas conforme con nuestra respuesta, puedes acudir al Área Defensa del Consumidor del Ministerio de Economía y
          Finanzas.
        </p>
      </LegalSection>

      <LegalSection title="Datos personales">
        <p>
          Usamos tus datos solo para gestionar tu turno. Los detalles están en la{" "}
          <LegalLink href="/privacidad">política de privacidad</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en estos términos">
        <p>
          Podemos actualizar estos términos; la versión vigente es siempre la publicada en esta página, con su fecha de
          actualización. Las reservas ya hechas se rigen por los términos vigentes al momento de reservar.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
