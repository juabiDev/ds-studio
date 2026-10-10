import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "No encontrado" };

// Replaces Next's default English 404 (e.g. a barber link to someone no longer on the team)
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">No encontramos esta página</h1>
      <p className="text-sm text-muted-foreground">Puede que el enlace sea viejo o que ese dato ya no exista.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm hover:bg-secondary">
        Volver a la agenda
      </Link>
    </main>
  );
}
