import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@ds-studio/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ds-studio/ui/table";

export const metadata: Metadata = { title: "Barberos" };
export const dynamic = "force-dynamic";

export default async function BarbersPage() {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      specialty: true,
      availabilities: {
        where: { availability: { deletedAt: null } },
        select: { available: true },
      },
    },
  });

  const rows = employees.map((e) => {
    const open = e.availabilities.filter((a) => a.available).length;
    return { ...e, open, blocked: e.availabilities.length - open };
  });

  if (rows.length === 0) {
    return <p className="text-muted-foreground">Todavía no hay barberos cargados.</p>;
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Barberos</h1>

      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((e) => (
          <li key={e.id}>
            <Link href={`/horarios?barbero=${e.id}`} className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary">
              <p className="font-medium">{e.name}</p>
              <p className="text-sm text-muted-foreground">
                {e.role}
                {e.specialty ? ` · ${e.specialty}` : ""}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-emerald-300">{e.open} disponibles</span>
                <span className="text-muted-foreground"> · {e.blocked} bloqueados por semana</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
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
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Link href={`/horarios?barbero=${e.id}`} className="underline-offset-4 hover:underline">
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
    </section>
  );
}
