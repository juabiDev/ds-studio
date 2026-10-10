"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@ds-studio/ui/utils";

import { MORE_ITEM, MORE_NAV, PRIMARY_NAV } from "@/lib/navigation";

const isActive = (href: string, pathname: string) => {
  // New-booking form lives under /turnos but belongs to the Agenda tab
  if (href === "/") return pathname === "/" || pathname.startsWith("/turnos");
  // "Más" stays highlighted on every screen it lists
  if (href === MORE_ITEM.href) return pathname.startsWith(MORE_ITEM.href) || MORE_NAV.some((i) => pathname.startsWith(i.href));
  return pathname.startsWith(href);
};

// Bottom tab bar on mobile (thumb zone), inline tabs in the header on desktop.
export const AdminNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none">
      <ul className="grid grid-cols-5 md:flex md:gap-1">
        {[...PRIMARY_NAV, MORE_ITEM].map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
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
