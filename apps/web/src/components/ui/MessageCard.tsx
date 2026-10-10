import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/lib/site-config";

interface MessageCardProps {
  /** Optional context above the title (e.g. the appointment being cancelled) */
  eyebrow?: ReactNode;
  title: string;
  children?: ReactNode;
  /** Buttons row */
  actions?: ReactNode;
}

/** Full-screen centered card for one-off messages: 404, cancel links, confirmations. */
export const MessageCard = ({ eyebrow, title, children, actions }: MessageCardProps) => (
  <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md text-center border border-white/15 px-6 py-12">
      <Link href="/" className="font-display text-white text-xl font-bold tracking-[0.3em]">
        {SITE_NAME}
      </Link>
      {eyebrow && <div className="mt-8">{eyebrow}</div>}
      <h1 className="font-display text-3xl font-bold text-white mt-8 mb-3">{title}</h1>
      {children && <div className="font-body text-white/65 text-sm max-w-xs mx-auto">{children}</div>}
      {actions && <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>}
    </div>
  </main>
);
