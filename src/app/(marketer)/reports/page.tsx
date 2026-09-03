"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { TableLoading } from "@/components/shared/loading";
import { ReportsTable } from "@/components/shared/reports-table";
import {
  FACILITY_TYPE_OPTIONS,
  OUTCOME_OPTIONS,
  type FacilityType,
  type Outcome,
} from "@/lib/types";
import { filterReports } from "@/lib/reporting";
import { useFacilities, useHydrated, useMarketers, useReports } from "@/lib/data/store";
import { useCurrentUser } from "@/lib/auth/session";

const ALL = "ALL";

export default function MyReportsPage() {
  const hydrated = useHydrated();
  const reports = useReports();
  const facilities = useFacilities();
  const marketers = useMarketers();
  const user = useCurrentUser();
  const marketerId = user.marketerId ?? user.id;

  const [date, setDate] = useState("");
  const [facilityType, setFacilityType] = useState<FacilityType | typeof ALL>(ALL);
  const [outcome, setOutcome] = useState<Outcome | typeof ALL>(ALL);

  const filtered = useMemo(
    () =>
      filterReports(
        reports,
        {
          marketerId,
          date: date || undefined,
          facilityType: facilityType === ALL ? undefined : facilityType,
          outcome: outcome === ALL ? undefined : outcome,
        },
        facilities,
      ),
    [reports, facilities, marketerId, date, facilityType, outcome],
  );

  const hasFilters = Boolean(date) || facilityType !== ALL || outcome !== ALL;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reports"
        description={hydrated ? `${filtered.length} report(s)` : undefined}
      />

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-date">Date</Label>
          <Input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Facility type</Label>
          <Select
            value={facilityType}
            onValueChange={(v) => setFacilityType(v as FacilityType | typeof ALL)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {FACILITY_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Outcome</Label>
          <Select
            value={outcome}
            onValueChange={(v) => setOutcome(v as Outcome | typeof ALL)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All outcomes</SelectItem>
              {OUTCOME_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters ? (
          <div className="sm:col-span-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDate("");
                setFacilityType(ALL);
                setOutcome(ALL);
              }}
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      {!hydrated ? (
        <TableLoading />
      ) : (
        <ReportsTable
          reports={filtered}
          facilities={facilities}
          marketers={marketers}
          hrefBase="/reports"
          emptyTitle="No reports match"
          emptyDescription="Adjust the filters or submit a new report."
        />
      )}
    </div>
  );
}
