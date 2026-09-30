import type { Metadata } from "next";

import { getSiteSettings } from "@ds-studio/database/settings-store";

import { SettingsForm } from "@/components/features/settings/SettingsForm";

export const metadata: Metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Ajustes del sitio</h1>
        <p className="text-sm text-muted-foreground">Datos de contacto, ubicación y redes que se muestran en la web.</p>
      </div>
      <SettingsForm settings={settings} />
    </section>
  );
}
