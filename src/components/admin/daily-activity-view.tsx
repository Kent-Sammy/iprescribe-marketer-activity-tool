"use client";

import { useMemo } from "react";
import { Building2, CalendarCheck, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { BreakdownList } from "@/components/shared/breakdown-list";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { FACILITY_TYPE_LABELS, OUTCOME_LABELS } from "@/lib/types";
import { formatDateLong } from "@/lib/datetime";
import { filterReports, summariseReports } from "@/lib/reporting";
import { useFacilities, useReports } from "@/lib/mock/store";

interface DailyActivityViewProps {
  marketerId: string;
  /** yyyy-mm-dd (app tz) */
  date: string;
}

export function DailyActivityView({ marketerId, date }: DailyActivityViewProps) {
  const reports = useReports();
  const facilities = useFacilities();

  const dayReports = useMemo(
    () => filterReports(reports, { marketerId, date }, facilities),
    [reports, facilities, marketerId, date],
  );

  const summary = useMemo(() => summariseReports(dayReports), [dayReports]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium">
        {formatDateLong(`${date}T12:00:00Z`)}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total visits" value={summary.totalVisits} icon={MapPin} />
        <StatCard
          label="Facilities visited"
          value={summary.facilitiesVisited}
          icon={Building2}
        />
        <StatCard
          label="People contacted"
          value={summary.peopleContacted}
          icon={Users}
        />
        <StatCard
          label="Follow-ups created"
          value={summary.followUpsCreated}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facility types</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              items={summary.facilityTypeBreakdown.map((b) => ({
                label: FACILITY_TYPE_LABELS[b.type],
                count: b.count,
              }))}
              total={summary.totalReports}
              emptyLabel="No visits on this day."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              items={summary.outcomeBreakdown.map((b) => ({
                label: OUTCOME_LABELS[b.outcome],
                count: b.count,
              }))}
              total={summary.totalReports}
              emptyLabel="No outcomes recorded."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports ({dayReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            reports={dayReports}
            facilities={facilities}
            hrefBase="/admin/reports"
            emptyTitle="No reports submitted"
            emptyDescription="This marketer has no reports for the selected day."
          />
        </CardContent>
      </Card>
    </div>
  );
}
