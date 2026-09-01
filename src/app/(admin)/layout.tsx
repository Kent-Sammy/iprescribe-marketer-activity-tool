import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/lib/nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={ADMIN_NAV} homeHref="/admin">
      {children}
    </AppShell>
  );
}
