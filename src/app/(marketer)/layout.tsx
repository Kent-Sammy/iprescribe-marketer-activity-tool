import { AppShell } from "@/components/layout/app-shell";
import { MARKETER_NAV } from "@/lib/nav";

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={MARKETER_NAV} homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
