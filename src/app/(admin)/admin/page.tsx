"use client";

import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  MapPin,
  PlusCircle,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PageLoading } from "@/components/shared/loading";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { OutcomeBadge } from "@/components/shared/badges";
import { formatDate, formatDateLong, isToday } from "@/lib/datetime";
import { adminDashboardStats, isFollowUpOpen, isFollowUpOverdue } from "@/lib/reporting";
import { useFacilities, useHydrated, useMarketers, useReports } from "@/lib/data/store";

export default function AdminDashboardPage() {
  const hydrated = useHydrated();
  const reports = useReports();
  const marketers = useMarketers();
  const facilities = useFacilities();

  if (!hydrated) return <PageLoading />;

  const stats = adminDashboardStats(reports, marketers, facilities);
  const todaysReports = reports.filter((r) => isToday(r.createdAt));
  const marketerById = new Map(marketers.map((m) => [m.id, m]));
  const facilityById = new Map(facilities.map((f) => [f.id, f]));
  const followUpsDue = reports
    .filter(isFollowUpOpen)
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description={formatDateLong(new Date())} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total marketers" value={stats.totalMarketers} icon={Users} />
        <StatCard
          label="Active marketers"
          value={stats.activeMarketers}
          icon={UserCheck}
          hint="Reported this week"
        />
        <StatCard label="Visits today" value={stats.visitsToday} icon={MapPin} />
        <StatCard
          label="Reports today"
          value={stats.reportsToday}
          icon={ClipboardList}
        />
        <StatCard
          label="Facilities visited"
          value={stats.facilitiesVisitedToday}
          icon={Building2}
          hint="Today"
        />
        <StatCard
          label="Follow-ups due"
          value={stats.followUpsDue}
          icon={CalendarCheck}
        />
        <StatCard
          label="New facilities"
          value={stats.newFacilitiesThisWeek}
          icon={PlusCircle}
          hint="This week"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reports today ({todaysReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              reports={todaysReports}
              facilities={facilities}
              hrefBase="/admin/reports"
              emptyTitle="No reports yet today"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-ups due</CardTitle>
          </CardHeader>
          <CardContent>
            {followUpsDue.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Nothing outstanding" />
            ) : (
              <ul className="space-y-3">
                {followUpsDue.map((r) => {
                  const facility = facilityById.get(r.facilityId);
                  const marketer = marketerById.get(r.marketerId);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="block rounded-lg border border-border p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {facility?.name ?? "Facility"}
                          </span>
                          <OutcomeBadge outcome={r.outcome} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {marketer?.name} · due{" "}
                          <span
                            className={
                              isFollowUpOverdue(r) ? "font-medium text-destructive" : ""
                            }
                          >
                            {r.followUpDate ? formatDate(r.followUpDate) : "—"}
                          </span>
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
