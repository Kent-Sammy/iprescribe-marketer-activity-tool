"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  ClipboardPlus,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PageLoading } from "@/components/shared/loading";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { OutcomeBadge } from "@/components/shared/badges";
import { formatDate, formatDateLong } from "@/lib/datetime";
import { marketerDashboardStats, isFollowUpOpen } from "@/lib/reporting";
import { useFacilities, useHydrated, useReports } from "@/lib/data/store";
import { useCurrentUser } from "@/lib/auth/session";

export default function MarketerDashboardPage() {
  const hydrated = useHydrated();
  const reports = useReports();
  const facilities = useFacilities();
  const user = useCurrentUser();
  const marketerId = user.marketerId ?? user.id;

  if (!hydrated) return <PageLoading />;

  const stats = marketerDashboardStats(reports, marketerId);
  const openFollowUps = reports
    .filter((r) => r.marketerId === marketerId && isFollowUpOpen(r))
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));
  const facilityById = new Map(facilities.map((f) => [f.id, f]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description={formatDateLong(new Date())}
        actions={
          <Button asChild size="lg">
            <Link href="/reports/new">
              <ClipboardPlus className="h-4 w-4" />
              Submit Field Report
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visits today" value={stats.visitsToday} icon={MapPin} />
        <StatCard
          label="Reports today"
          value={stats.reportsToday}
          icon={ClipboardList}
        />
        <StatCard
          label="Visits this week"
          value={stats.visitsThisWeek}
          icon={CalendarRange}
        />
        <StatCard
          label="Follow-ups required"
          value={stats.followUpsRequired}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              reports={stats.recent}
              facilities={facilities}
              hrefBase="/reports"
              emptyTitle="No reports yet"
              emptyDescription="Submit your first field report to see it here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            {openFollowUps.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Nothing due"
                description="Follow-ups you flag will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {openFollowUps.slice(0, 6).map((r) => {
                  const facility = facilityById.get(r.facilityId);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/reports/${r.id}`}
                        className="block rounded-lg border border-border p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {facility?.name ?? "Facility"}
                          </span>
                          <OutcomeBadge outcome={r.outcome} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due {r.followUpDate ? formatDate(r.followUpDate) : "—"} ·{" "}
                          {r.contactName}
                          {r.contactPhone ? ` · ${r.contactPhone}` : ""}
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
