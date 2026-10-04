"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarDays, CalendarOff, Clock, Settings, Users } from "lucide-react";

import { cn } from "@ds-studio/ui/utils";
const ITEMS = [
  { href: "/", label: "Agenda", icon: CalendarDays },
  { href: "/horarios", label: "Horarios", icon: Clock },
  { href: "/cierres", label: "Cierres", icon: CalendarOff },
  { href: "/barberos", label: "Barberos", icon: Users },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

// Bottom tab bar on mobile (thumb zone), inline tabs in the header on desktop.
export const AdminNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none">
      <ul className="grid grid-cols-5 md:flex md:gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          // New-booking form lives under /turnos but belongs to the Agenda tab
          const active = href === "/" ? pathname === "/" || pathname.startsWith("/turnos") : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs md:min-h-10 md:flex-row md:gap-2 md:rounded-md md:px-3 md:text-sm",
                  active ? "text-foreground md:bg-secondary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={20} className="md:size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
