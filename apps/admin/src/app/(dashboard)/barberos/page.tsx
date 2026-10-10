import type { Metadata } from "next";
import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ds-studio/ui/table";

import { type BarberWithSlotCounts, getBarbersWithSlotCounts } from "@/lib/data/employees";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Barberos" };
export const dynamic = "force-dynamic";

// Profile + photo; the edit page links on to the barber's schedule
const editHref = (employeeId: string) => `/barberos/${employeeId}`;

const BarberCards = ({ barbers }: { barbers: BarberWithSlotCounts[] }) => (
  <ul className="flex flex-col gap-3 md:hidden">
    {barbers.map((e) => (
      <li key={e.id}>
        <Link href={editHref(e.id)} className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary">
          <p className="font-medium">{e.name}</p>
          <p className="text-sm text-muted-foreground">
            {e.role}
            {e.specialty ? ` · ${e.specialty}` : ""}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-emerald-300">{plural(e.open, "horario disponible", "horarios disponibles")}</span>
            <span className="text-muted-foreground"> · {plural(e.blocked, "bloqueado", "bloqueados")} por semana</span>
          </p>
        </Link>
      </li>
    ))}
  </ul>
);

const BarberTable = ({ barbers }: { barbers: BarberWithSlotCounts[] }) => (
  <div className="hidden md:block">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Especialidad</TableHead>
          <TableHead className="text-right">Horarios disponibles</TableHead>
          <TableHead className="text-right">Horarios bloqueados</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {barbers.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <Link href={editHref(e.id)} className="underline-offset-4 hover:underline">
                {e.name}
              </Link>
            </TableCell>
            <TableCell>{e.role}</TableCell>
            <TableCell>{e.specialty ?? "—"}</TableCell>
            <TableCell className="text-right">{e.open}</TableCell>
            <TableCell className="text-right">{e.blocked}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default async function BarbersPage() {
  const barbers = await getBarbersWithSlotCounts();

  if (barbers.length === 0) {
    return <p className="text-muted-foreground">Todavía no hay barberos cargados.</p>;
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Barberos</h1>
        <p className="text-sm text-muted-foreground">Toca un barbero para editar su foto y sus datos del sitio.</p>
      </div>
      {/* Cards on mobile, table on desktop */}
      <BarberCards barbers={barbers} />
      <BarberTable barbers={barbers} />
    </section>
  );
}
