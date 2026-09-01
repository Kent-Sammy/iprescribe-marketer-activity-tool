import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** match nested routes (e.g. /reports/123) */
  matchPrefix?: boolean;
}

export const MARKETER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Reports", href: "/reports", icon: FileText, matchPrefix: true },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Marketers", href: "/admin/marketers", icon: Users, matchPrefix: true },
  { label: "Daily Activity", href: "/admin/daily", icon: CalendarDays },
  { label: "Reports", href: "/admin/reports", icon: FileText, matchPrefix: true },
  { label: "Facilities", href: "/admin/facilities", icon: Building2, matchPrefix: true },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  if (!item.matchPrefix) return false;
  // "My Reports" (/reports) should not light up on the "New Report" flow.
  if (item.href === "/reports" && pathname.startsWith("/reports/new")) return false;
  return pathname.startsWith(`${item.href}/`);
}
