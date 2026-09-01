/**
 * Pure reporting/aggregation helpers.
 *
 * These take plain arrays and return derived data (dashboard stats, filtered
 * lists, timelines). They contain the business logic that the backend service
 * layer (`src/lib/services/*`) will eventually own — keeping them pure and
 * framework-free makes that move a copy-paste.
 */

import type { Facility, Marketer, Outcome, Report } from "@/lib/types";
import { appWeekStartYMD, byNewest, isToday, isThisWeek, toAppYMD } from "@/lib/datetime";

/* ------------------------------- filtering ------------------------------ */

export interface ReportFilters {
  marketerId?: string;
  facilityId?: string;
  facilityType?: Report["facilityTypeSnapshot"];
  outcome?: Outcome;
  followUp?: "REQUIRED" | "OPEN" | "COMPLETED" | "NONE";
  /** yyyy-mm-dd (app tz) */
  dateFrom?: string;
  dateTo?: string;
  /** single day yyyy-mm-dd (app tz) — takes precedence over range */
  date?: string;
  /** free-text over facility name / contact name / remarks */
  q?: string;
}

export function filterReports(
  reports: Report[],
  filters: ReportFilters,
  facilities: Facility[],
): Report[] {
  const facilityById = new Map(facilities.map((f) => [f.id, f]));
  const q = filters.q?.trim().toLowerCase();

  return reports
    .filter((r) => {
      if (filters.marketerId && r.marketerId !== filters.marketerId) return false;
      if (filters.facilityId && r.facilityId !== filters.facilityId) return false;
      if (filters.facilityType && r.facilityTypeSnapshot !== filters.facilityType) return false;
      if (filters.outcome && r.outcome !== filters.outcome) return false;

      if (filters.followUp === "REQUIRED" && !r.followUpRequired) return false;
      if (filters.followUp === "OPEN" && !(r.followUpRequired && !r.followUpCompletedAt))
        return false;
      if (filters.followUp === "COMPLETED" && !r.followUpCompletedAt) return false;
      if (filters.followUp === "NONE" && r.followUpRequired) return false;

      const ymd = toAppYMD(r.createdAt);
      if (filters.date && ymd !== filters.date) return false;
      if (filters.dateFrom && ymd < filters.dateFrom) return false;
      if (filters.dateTo && ymd > filters.dateTo) return false;

      if (q) {
        const facility = facilityById.get(r.facilityId);
        const haystack = [facility?.name ?? "", r.contactName, r.remarks]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort(byNewest);
}

export function hasActiveFilters(filters: ReportFilters): boolean {
  return Object.values(filters).some((v) => v !== undefined && v !== "");
}

/* ------------------------------ follow-ups ----------------------------- */

export function isFollowUpOpen(r: Report): boolean {
  return r.followUpRequired && !r.followUpCompletedAt;
}

export function isFollowUpOverdue(r: Report): boolean {
  return Boolean(isFollowUpOpen(r) && r.followUpDate && r.followUpDate < toAppYMD(new Date()));
}

export function followUpLabel(r: Report): "None" | "Open" | "Overdue" | "Completed" {
  if (!r.followUpRequired) return "None";
  if (r.followUpCompletedAt) return "Completed";
  return isFollowUpOverdue(r) ? "Overdue" : "Open";
}

/* ------------------------------ dashboards ---------------------------- */

export interface MarketerDashboardStats {
  visitsToday: number;
  reportsToday: number;
  visitsThisWeek: number;
  followUpsRequired: number;
  recent: Report[];
}

/** One report == one visit in this product. */
export function marketerDashboardStats(
  reports: Report[],
  marketerId: string,
): MarketerDashboardStats {
  const mine = reports.filter((r) => r.marketerId === marketerId).sort(byNewest);
  return {
    visitsToday: mine.filter((r) => isToday(r.createdAt)).length,
    reportsToday: mine.filter((r) => isToday(r.createdAt)).length,
    visitsThisWeek: mine.filter((r) => isThisWeek(r.createdAt)).length,
    followUpsRequired: mine.filter(isFollowUpOpen).length,
    recent: mine.slice(0, 6),
  };
}

export interface AdminDashboardStats {
  totalMarketers: number;
  activeMarketers: number;
  visitsToday: number;
  reportsToday: number;
  facilitiesVisitedToday: number;
  followUpsDue: number;
  newFacilitiesThisWeek: number;
}

export function adminDashboardStats(
  reports: Report[],
  marketers: Marketer[],
  facilities: Facility[],
): AdminDashboardStats {
  const todays = reports.filter((r) => isToday(r.createdAt));
  const activeMarketerIds = new Set(
    reports.filter((r) => isThisWeek(r.createdAt)).map((r) => r.marketerId),
  );
  return {
    totalMarketers: marketers.length,
    activeMarketers: marketers.filter((m) => activeMarketerIds.has(m.id)).length,
    visitsToday: todays.length,
    reportsToday: todays.length,
    facilitiesVisitedToday: new Set(todays.map((r) => r.facilityId)).size,
    followUpsDue: reports.filter(isFollowUpOpen).length,
    newFacilitiesThisWeek: facilities.filter((f) => isThisWeek(f.createdAt)).length,
  };
}

/* --------------------------- marketer rollups ----------------------- */

export interface MarketerRow {
  marketer: Marketer;
  reportsToday: number;
  visitsThisWeek: number;
  lastActivityAt?: string;
}

export function marketerRows(reports: Report[], marketers: Marketer[]): MarketerRow[] {
  return marketers
    .map((marketer) => {
      const mine = reports.filter((r) => r.marketerId === marketer.id).sort(byNewest);
      return {
        marketer,
        reportsToday: mine.filter((r) => isToday(r.createdAt)).length,
        visitsThisWeek: mine.filter((r) => isThisWeek(r.createdAt)).length,
        lastActivityAt: mine[0]?.createdAt,
      };
    })
    .sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""));
}

/* --------------------------- day summaries ------------------------- */

export interface DaySummary {
  totalVisits: number;
  totalReports: number;
  facilityTypeBreakdown: { type: Report["facilityTypeSnapshot"]; count: number }[];
  outcomeBreakdown: { outcome: Outcome; count: number }[];
  facilitiesVisited: number;
  peopleContacted: number;
  followUpsCreated: number;
}

export function summariseReports(reports: Report[]): DaySummary {
  const typeCounts = new Map<Report["facilityTypeSnapshot"], number>();
  const outcomeCounts = new Map<Outcome, number>();
  for (const r of reports) {
    typeCounts.set(r.facilityTypeSnapshot, (typeCounts.get(r.facilityTypeSnapshot) ?? 0) + 1);
    outcomeCounts.set(r.outcome, (outcomeCounts.get(r.outcome) ?? 0) + 1);
  }
  return {
    totalVisits: reports.length,
    totalReports: reports.length,
    facilityTypeBreakdown: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    outcomeBreakdown: [...outcomeCounts.entries()]
      .map(([outcome, count]) => ({ outcome, count }))
      .sort((a, b) => b.count - a.count),
    facilitiesVisited: new Set(reports.map((r) => r.facilityId)).size,
    peopleContacted: new Set(reports.map((r) => r.contactName.toLowerCase())).size,
    followUpsCreated: reports.filter((r) => r.followUpRequired).length,
  };
}

/* ---------------------------- grouping ---------------------------- */

export interface DayGroup {
  /** yyyy-mm-dd (app tz) */
  ymd: string;
  reports: Report[];
}

export function groupByDay(reports: Report[]): DayGroup[] {
  const map = new Map<string, Report[]>();
  for (const r of [...reports].sort(byNewest)) {
    const ymd = toAppYMD(r.createdAt);
    if (!map.has(ymd)) map.set(ymd, []);
    map.get(ymd)!.push(r);
  }
  return [...map.entries()]
    .map(([ymd, list]) => ({ ymd, reports: list }))
    .sort((a, b) => b.ymd.localeCompare(a.ymd));
}

/** Distinct dates (yyyy-mm-dd, app tz) a marketer has reports for, newest first. */
export function activeDatesForMarketer(reports: Report[], marketerId: string): string[] {
  const set = new Set(
    reports.filter((r) => r.marketerId === marketerId).map((r) => toAppYMD(r.createdAt)),
  );
  return [...set].sort((a, b) => b.localeCompare(a));
}

export const currentWeekStart = () => appWeekStartYMD(new Date());
