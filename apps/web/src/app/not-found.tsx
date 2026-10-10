import type { Metadata } from "next";
import Link from "next/link";

import { primaryButton, secondaryButton } from "@/components/features/booking/wizard-styles";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

// Replaces Next's default English 404; same frame as the cancel page
export default function NotFound() {
  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center border border-white/15 px-6 py-12">
        <Link href="/" className="font-display text-white text-xl font-bold tracking-[0.3em]">
          DS STUDIO
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mt-8 mb-3">Página no encontrada</h1>
        <p className="font-body text-white/65 text-sm max-w-xs mx-auto">
          La página que buscas no existe o cambió de dirección.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/#agendar" className={primaryButton}>
            Reservar turno
          </Link>
          <Link href="/" className={secondaryButton}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
