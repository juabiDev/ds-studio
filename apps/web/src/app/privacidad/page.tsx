import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CUSTOMER_DATA_RETENTION_MONTHS, IP_HASH_RETENTION_DAYS } from "@ds-studio/database/retention";

import { getBusinessInfo } from "@/lib/data/business";
import { SITE_NAME } from "@/lib/site-config";

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

// Contact details come from the admin settings; refreshed like the home page
export const revalidate = 300;

const LAST_UPDATED = "10 de octubre de 2026";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10">
    <h2 className="font-display font-bold text-white text-2xl mb-3">{title}</h2>
    <div className="font-body text-white/75 leading-relaxed flex flex-col gap-3">{children}</div>
  </section>
);

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 flex flex-col gap-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default async function PrivacyPage() {
  const business = await getBusinessInfo();
  const address = [business.address.street, business.address.neighborhood, business.address.city].filter(Boolean).join(", ");
  const emailLink = (
    <a href={`mailto:${business.email}`} className="text-white underline underline-offset-4">
      {business.email}
    </a>
  );

  return (
    <main className="min-h-dvh bg-background px-6 py-16">
      <article className="max-w-2xl mx-auto">
        <Link href="/" className="font-display text-white text-xl font-bold tracking-[0.3em]">
          {SITE_NAME}
        </Link>

        <h1 className="font-display font-bold text-white text-4xl md:text-5xl mt-10">Política de privacidad</h1>
        <p className="font-condensed text-white/60 text-sm tracking-wider mt-3">Última actualización: {LAST_UPDATED}</p>

        <Section title="Quién es responsable">
          <p>
            {SITE_NAME}, con domicilio en {address}, Uruguay, es responsable de los datos personales que nos dejas al
            reservar un turno. Los tratamos según la Ley N° 18.331 de Protección de Datos Personales y sus decretos
            reglamentarios. Para cualquier consulta escríbenos a {emailLink}.
          </p>
        </Section>

        <Section title="Qué datos recolectamos">
          <List
            items={[
              "Al reservar: nombre, teléfono y email, junto con el servicio, el barbero, el día y la hora del turno.",
              "Si respondes nuestros mensajes de WhatsApp: tu respuesta (por ejemplo, confirmar o cancelar el turno).",
              "Por seguridad: un código derivado de tu dirección IP (nunca la IP en sí), para frenar reservas automáticas.",
            ]}
          />
          <p>No usamos cookies de publicidad ni herramientas de seguimiento.</p>
        </Section>

        <Section title="Para qué los usamos">
          <List
            items={[
              "Gestionar tu turno: confirmarlo, recordártelo el mismo día y permitirte cancelarlo.",
              "Contactarte si hay un cambio en tu reserva.",
              "Proteger el sistema de reservas contra abusos y bots.",
            ]}
          />
          <p>No vendemos ni cedemos tus datos, y no los usamos para enviarte publicidad.</p>
        </Section>

        <Section title="Con quién los compartimos">
          <p>Solo con los proveedores que necesitamos para que las reservas funcionen, que los tratan por cuenta nuestra:</p>
          <List
            items={[
              "Railway: alojamiento del sitio y de la base de datos.",
              "Resend: envío de los emails de confirmación y recordatorio.",
              "Meta (WhatsApp Business): mensajes de confirmación y recordatorio por WhatsApp.",
              "Cloudflare: verificación anti-bots (Turnstile) y almacenamiento de las fotos del sitio.",
            ]}
          />
          <p>Algunos de estos proveedores procesan datos fuera de Uruguay.</p>
        </Section>

        <Section title="Cuánto tiempo los guardamos">
          <p>
            Tu nombre, teléfono y email se borran automáticamente {CUSTOMER_DATA_RETENTION_MONTHS} meses después de la
            fecha del turno. Conservamos solo datos anónimos (día, servicio y barbero) para estadísticas internas. El código
            derivado de tu IP se borra a los {IP_HASH_RETENTION_DAYS} días.
          </p>
        </Section>

        <Section title="Tus derechos">
          <p>
            Puedes pedir en cualquier momento acceder a tus datos, corregirlos, actualizarlos o eliminarlos. Escríbenos a{" "}
            {emailLink} o por{" "}
            <a href={business.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">
              WhatsApp
            </a>{" "}
            y te respondemos dentro de los plazos que fija la ley.
          </p>
          <p>
            Si consideras que no atendimos tu pedido, puedes presentar un reclamo ante la{" "}
            <a
              href="https://www.gub.uy/unidad-reguladora-control-datos-personales/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-4"
            >
              Unidad Reguladora y de Control de Datos Personales (URCDP)
            </a>
            .
          </p>
        </Section>

        <Section title="Seguridad">
          <p>
            Usamos conexiones cifradas (HTTPS), acceso restringido al panel de administración y guardamos solo lo necesario
            para gestionar tu turno.
          </p>
        </Section>

        <Link
          href="/"
          className="inline-flex items-center mt-12 min-h-12 border border-white/40 px-8 font-condensed text-white/85 tracking-[0.25em] uppercase text-sm hover:border-white/70 hover:text-white transition-all"
        >
          Volver al inicio
        </Link>
      </article>
    </main>
  );
}
