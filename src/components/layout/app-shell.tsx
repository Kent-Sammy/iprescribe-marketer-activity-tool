"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/lib/nav";
import { useAuthActions, useCurrentUser } from "@/lib/auth/mock-session";
import { ResetDemoDataButton } from "@/components/layout/reset-demo-data";

interface AppShellProps {
  nav: NavItem[];
  /** Home link for the logo. */
  homeHref: string;
  children: React.ReactNode;
}

export function AppShell({ nav, homeHref, children }: AppShellProps) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { signOut } = useAuthActions();

  function handleSignOut() {
    // Clerk clears the session and redirects to /login.
    void signOut();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={homeHref} className="flex items-center gap-2 font-semibold">
            <span className="rounded-md bg-primary p-1 text-primary-foreground">
              <Radar className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Marketer Activity Tool</span>
          </Link>
          <Badge tone="warning" className="hidden sm:inline-flex">
            Demo
          </Badge>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <ResetDemoDataButton />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{user.name}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">
                {user.role === "ADMIN" ? "Admin" : "Marketer"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* ---------- Desktop sidebar ---------- */}
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {nav.map((item) => {
              const active = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ---------- Main content ---------- */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {nav.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
