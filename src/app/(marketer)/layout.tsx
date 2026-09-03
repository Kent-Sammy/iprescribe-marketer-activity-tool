"use client";

// See the note in (admin)/layout.tsx — same reasoning: this is an interactive
// UI shell with no server-only logic, so it lives on the client side of the
// RSC boundary and never passes icon function refs Server -> Client.
import { AppShell } from "@/components/layout/app-shell";
import { PageLoading } from "@/components/shared/loading";
import { RequireRole } from "@/lib/auth/session";
import { MARKETER_NAV } from "@/lib/nav";

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="MARKETER" fallback={<PageLoading />}>
      <AppShell nav={MARKETER_NAV} homeHref="/dashboard">
        {children}
      </AppShell>
    </RequireRole>
  );
}
