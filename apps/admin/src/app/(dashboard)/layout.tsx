import { LogOut } from "lucide-react";

import { requireAdmin } from "@ds-studio/auth";

import { AdminNav } from "@/components/features/navigation/AdminNav";

// Plain form POST: works without client JS
const SignOutButton = () => (
  <form action="/auth/sign-out" method="post">
    <button
      type="submit"
      aria-label="Salir"
      className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <LogOut size={18} />
    </button>
  </form>
);

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdmin("/login");

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2 md:px-6">
          <span className="font-display text-lg font-bold tracking-wide">DS STUDIO</span>
          <div className="hidden md:block">
            <AdminNav />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Bottom padding keeps content clear of the mobile tab bar */}
      <main className="mx-auto max-w-5xl px-4 pt-5 md:px-6 md:pb-10">{children}</main>

      <div className="md:hidden">
        <AdminNav />
      </div>
    </div>
  );
}
