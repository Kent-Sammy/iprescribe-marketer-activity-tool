"use client";

// See the note in (admin)/layout.tsx — same reasoning: this is an interactive
// UI shell with no server-only logic, so it lives on the client side of the
// RSC boundary and never passes icon function refs Server -> Client.
import { AppShell } from "@/components/layout/app-shell";
import { MARKETER_NAV } from "@/lib/nav";

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={MARKETER_NAV} homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
