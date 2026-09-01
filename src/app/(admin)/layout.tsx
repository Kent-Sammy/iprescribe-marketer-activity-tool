"use client";

// This layout is a purely interactive UI shell (nav, role switcher, sign-out via
// <AppShell>, which is itself a Client Component). It has no server-only logic.
// Marking it "use client" keeps the nav config — whose items hold lucide icon
// component references — on the client side of the boundary, so those function
// props are never passed Server -> Client during prerendering. Pages rendered as
// `children` are unaffected and still prerender.
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/lib/nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={ADMIN_NAV} homeHref="/admin">
      {children}
    </AppShell>
  );
}
