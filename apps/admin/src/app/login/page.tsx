import type { Metadata } from "next";
import Image from "next/image";

import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel: full-bleed backdrop on mobile, left column on desktop */}
      <section className="relative isolate hidden overflow-hidden lg:block">
        <Image src="/images/login.jpg" alt="" fill priority sizes="55vw" className="-z-10 object-cover grayscale" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-background/20" />

        <div className="flex h-full flex-col justify-between p-12">
          <span className="font-condensed text-xs uppercase tracking-[0.4em] text-foreground/70">Panel de administración</span>
          <div>
            <p className="font-display text-6xl font-black leading-none tracking-tight xl:text-7xl">
              DS <span className="italic text-accent">Studio</span>
            </p>
            <div className="mt-6 h-px w-16 bg-accent" />
            <p className="mt-6 max-w-sm font-condensed text-lg uppercase tracking-[0.2em] text-foreground/70">
              Agenda, clientes y galería en un solo lugar.
            </p>
          </div>
        </div>
      </section>

      <section className="relative isolate flex items-center justify-center px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] sm:px-8">
        {/* Mobile-only backdrop so the small screen keeps the studio's look */}
        <Image src="/images/login.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover opacity-20 grayscale lg:hidden" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/90 to-background lg:hidden" />

        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="font-display text-4xl font-black tracking-tight lg:hidden">
              DS <span className="italic text-accent">Studio</span>
            </p>
            <h1 className="mt-6 font-condensed text-sm font-medium uppercase tracking-[0.35em] text-accent lg:mt-0">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-muted-foreground">Ingresa con tu cuenta de administrador.</p>
          </div>

          <LoginForm />

          <p className="mt-10 text-center font-condensed text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
            Acceso restringido
          </p>
        </div>
      </section>
    </main>
  );
}
