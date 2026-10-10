import type { Metadata } from "next";
import Link from "next/link";

import { MessageCard } from "@/components/ui/MessageCard";

import { primaryButton, secondaryButton } from "@/lib/button-styles";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

// Replaces Next's default English 404
export default function NotFound() {
  return (
    <MessageCard
      title="Página no encontrada"
      actions={
        <>
          <Link href="/#agendar" className={primaryButton}>
            Reservar turno
          </Link>
          <Link href="/" className={secondaryButton}>
            Volver al inicio
          </Link>
        </>
      }
    >
      <p>La página que buscas no existe o cambió de dirección.</p>
    </MessageCard>
  );
}
