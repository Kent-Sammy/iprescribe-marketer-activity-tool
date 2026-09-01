"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
import { PageLoading } from "@/components/shared/loading";
import { ReportsTable } from "@/components/shared/reports-table";
import {
  FACILITY_TYPE_OPTIONS,
  OUTCOME_OPTIONS,
  type FacilityType,
  type Outcome,
} from "@/lib/types";
import { filterReports, type ReportFilters } from "@/lib/reporting";
import { useFacilities, useHydrated, useMarketers, useReports } from "@/lib/mock/store";

const ALL = "ALL";
const PAGE_SIZE = 25;

const FOLLOW_UP_OPTIONS = [
  { value: "REQUIRED", label: "Any follow-up" },
  { value: "OPEN", label: "Open" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NONE", label: "No follow-up" },
] as const;

function AllReportsInner() {
  const hydrated = useHydrated();
  const reports = useReports();
  const facilities = useFacilities();
  const marketers = useMarketers();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (k: string) => searchParams.get(k) ?? "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    if (key !== "page") params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.replace(pathname);
  }

  const filters: ReportFilters = useMemo(
    () => ({
      dateFrom: get("dateFrom") || undefined,
      dateTo: get("dateTo") || undefined,
      marketerId: get("marketerId") || undefined,
      facilityType: (get("facilityType") as FacilityType) || undefined,
      facilityId: get("facilityId") || undefined,
      outcome: (get("outcome") as Outcome) || undefined,
      followUp: (get("followUp") as ReportFilters["followUp"]) || undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  const filtered = useMemo(
    () => (hydrated ? filterReports(reports, filters, facilities) : []),
    [hydrated, reports, filters, facilities],
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  if (!hydrated) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Reports"
        description={`${filtered.length} report(s)${
          activeFilterCount ? ` · ${activeFilterCount} filter(s) applied` : ""
        }`}
        actions={
          activeFilterCount ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="h-4 w-4" />
              Clear all
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={get("dateFrom")}
            onChange={(e) => setParam("dateFrom", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={get("dateTo")}
            onChange={(e) => setParam("dateTo", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Marketer</Label>
          <Select
            value={get("marketerId") || ALL}
            onValueChange={(v) => setParam("marketerId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All marketers</SelectItem>
              {marketers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Facility type</Label>
          <Select
            value={get("facilityType") || ALL}
            onValueChange={(v) => setParam("facilityType", v)}
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
          <Label>Facility</Label>
          <Select
            value={get("facilityId") || ALL}
            onValueChange={(v) => setParam("facilityId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All facilities</SelectItem>
              {[...facilities]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Outcome</Label>
          <Select
            value={get("outcome") || ALL}
            onValueChange={(v) => setParam("outcome", v)}
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
        <div className="space-y-1.5">
          <Label>Follow-up status</Label>
          <Select
            value={get("followUp") || ALL}
            onValueChange={(v) => setParam("followUp", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {FOLLOW_UP_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReportsTable
        reports={pageRows}
        facilities={facilities}
        marketers={marketers}
        hrefBase="/admin/reports"
        showMarketer
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {clampedPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={clampedPage <= 1}
              onClick={() => setParam("page", String(clampedPage - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={clampedPage >= totalPages}
              onClick={() => setParam("page", String(clampedPage + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AllReportsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AllReportsInner />
    </Suspense>
  );
}
