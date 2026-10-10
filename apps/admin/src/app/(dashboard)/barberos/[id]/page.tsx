import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import { BarberPhotoUpload } from "@/components/features/barbers/BarberPhotoUpload";
import { BarberProfileForm } from "@/components/features/barbers/BarberProfileForm";

import { isImageUploadConfigured } from "@/lib/cloudflare-images";
import { getBarberProfile } from "@/lib/data/employees";

export const metadata: Metadata = { title: "Editar barbero" };
export const dynamic = "force-dynamic";

export default async function BarberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const barber = await getBarberProfile(id);
  if (!barber) notFound();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <Link href="/barberos" className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> Barberos
        </Link>
        <h1 className="text-xl font-semibold">{barber.name}</h1>
        <p className="text-sm text-muted-foreground">
          Lo que se muestra en la sección «Nuestros barberos».{" "}
          <Link href={`/horarios?barbero=${barber.id}`} className="underline underline-offset-4">
            Ver horarios
          </Link>
        </p>
      </div>

      <BarberPhotoUpload employeeId={barber.id} name={barber.name} photoUrl={barber.photoUrl} enabled={isImageUploadConfigured()} />
      <BarberProfileForm barber={barber} />
    </section>
  );
}
