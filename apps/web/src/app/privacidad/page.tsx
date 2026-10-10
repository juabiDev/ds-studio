import type { Metadata } from "next";

import { CUSTOMER_DATA_RETENTION_MONTHS, IP_HASH_RETENTION_DAYS } from "@ds-studio/database/retention";
import { isWhatsAppConfigured } from "@ds-studio/messaging";

import { LegalLink, LegalList, LegalPage, LegalSection } from "@/components/features/legal/LegalPage";

import { getBusinessInfo } from "@/lib/data/business";
import { LEGAL_ENTITY, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Cómo ${SITE_NAME} trata los datos personales de quienes reservan un turno.`,
  alternates: { canonical: "/privacidad" },
  // Own share data, so a shared link doesn't preview as the home page
  openGraph: {
    title: `Política de privacidad — ${SITE_NAME}`,
    description: `Cómo ${SITE_NAME} trata los datos personales de quienes reservan un turno.`,
    url: "/privacidad",
    siteName: SITE_NAME,
    locale: "es_UY",
    type: "website",
  },
};

// Contact details come from the admin settings; refreshed on each admin save (and every 5 minutes)
export const revalidate = 300;

const LAST_UPDATED = "10 de octubre de 2026";

export default async function PrivacyPage() {
  const business = await getBusinessInfo();
  // WhatsApp messages are only mentioned once they're actually sent
  const whatsapp = isWhatsAppConfigured();
  const address = [business.address.street, business.address.neighborhood, business.address.city].filter(Boolean).join(", ");
  const emailLink = <LegalLink href={`mailto:${business.email}`}>{business.email}</LegalLink>;

  return (
    <LegalPage title="Política de privacidad" updated={LAST_UPDATED}>
      <LegalSection title="Quién es responsable">
        <p>
          {SITE_NAME} ({LEGAL_ENTITY.name}, RUT {LEGAL_ENTITY.rut}), con domicilio en {address}, Uruguay, es
          responsable de los datos personales que nos dejas al reservar un turno. Los tratamos según la Ley N° 18.331 de
          Protección de Datos Personales y sus decretos reglamentarios. Para cualquier consulta escríbenos a {emailLink}.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos recolectamos">
        <LegalList
          items={[
            "Al reservar: nombre, teléfono y email, junto con el servicio, el barbero, el día y la hora del turno.",
            ...(whatsapp
              ? ["Si respondes nuestros mensajes de WhatsApp: tu respuesta (por ejemplo, confirmar o cancelar el turno)."]
              : []),
            "Por seguridad: un código derivado de tu dirección IP (nunca la IP en sí), para frenar reservas automáticas.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Para qué los usamos">
        <LegalList
          items={[
            "Gestionar tu turno: confirmarlo, recordártelo el mismo día y permitirte cancelarlo.",
            "Contactarte si hay un cambio en tu reserva.",
            "Proteger el sistema de reservas contra abusos y bots.",
          ]}
        />
        <p>No vendemos ni cedemos tus datos, y no los usamos para enviarte publicidad.</p>
      </LegalSection>

      <LegalSection title="Con quién los compartimos">
        <p>Solo con los proveedores que necesitamos para que las reservas funcionen, que los tratan por cuenta nuestra:</p>
        <LegalList
          items={[
            "Railway: alojamiento del sitio y de la base de datos.",
            "Resend: envío de los emails de confirmación y recordatorio.",
            ...(whatsapp ? ["Meta (WhatsApp Business): mensajes de confirmación y recordatorio por WhatsApp."] : []),
            "Cloudflare: verificación anti-bots (Turnstile) y almacenamiento de las fotos del sitio.",
          ]}
        />
        <p>Algunos de estos proveedores procesan datos fuera de Uruguay.</p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo los guardamos">
        <p>
          Tu nombre, teléfono y email se borran automáticamente {CUSTOMER_DATA_RETENTION_MONTHS} meses después de la fecha
          del turno. Conservamos solo datos anónimos (día, servicio y barbero) para estadísticas internas. El código
          derivado de tu IP se borra a los {IP_HASH_RETENTION_DAYS} días.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Este sitio no usa cookies de publicidad, de análisis ni de seguimiento, por eso no te pedimos que las aceptes. El
          control anti-bots del formulario de reserva (Cloudflare Turnstile) funciona con un código de un solo uso y no
          sirve para identificarte ni para seguirte en otros sitios.
        </p>
        <p>Si en el futuro agregamos cookies que no sean necesarias, te vamos a pedir permiso antes de usarlas.</p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Puedes pedir en cualquier momento acceder a tus datos, corregirlos, actualizarlos o eliminarlos. Escríbenos a{" "}
          {emailLink} o por <LegalLink href={business.whatsappUrl}>WhatsApp</LegalLink> y te respondemos dentro de los
          plazos que fija la ley.
        </p>
        <p>
          Si consideras que no atendimos tu pedido, puedes presentar un reclamo ante la{" "}
          <LegalLink href="https://www.gub.uy/unidad-reguladora-control-datos-personales/">
            Unidad Reguladora y de Control de Datos Personales (URCDP)
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Seguridad">
        <p>
          Usamos conexiones cifradas (HTTPS), acceso restringido al panel de administración y guardamos solo lo necesario
          para gestionar tu turno.
        </p>
      </LegalSection>

      <LegalSection title="Condiciones de reserva">
        <p>
          Cómo funcionan las reservas, las cancelaciones y los reclamos está en los{" "}
          <LegalLink href="/terminos">términos y condiciones</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
