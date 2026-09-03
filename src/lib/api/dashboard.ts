/**
 * Server-computed dashboard figures.
 *
 * These mirror `marketerDashboardStats`, `adminDashboardStats` and
 * `summariseReports` in `src/lib/reporting.ts` exactly — same definitions of
 * "today", "this week" and "follow-up due", computed in SQL. Use them on any
 * screen that shouldn't have to download the full report set to add it up.
 */

import { apiFetch, type SessionRole } from "@/lib/api/client";
import type { FacilityType, Outcome, Report } from "@/lib/types";

export interface MarketerDashboard {
  visitsToday: number;
  reportsToday: number;
  visitsThisWeek: number;
  followUpsRequired: number;
  recent: Report[];
}

export interface AdminDashboard {
  totalMarketers: number;
  activeMarketers: number;
  visitsToday: number;
  reportsToday: number;
  facilitiesVisitedToday: number;
  followUpsDue: number;
  newFacilitiesThisWeek: number;
}

export interface ActivitySummary {
  totalVisits: number;
  totalReports: number;
  facilityTypeBreakdown: { type: FacilityType; count: number }[];
  outcomeBreakdown: { outcome: Outcome; count: number }[];
  facilitiesVisited: number;
  peopleContacted: number;
  followUpsCreated: number;
}

export function marketerDashboard(): Promise<MarketerDashboard> {
  return apiFetch<MarketerDashboard>("/v1/marketer/dashboard/stats");
}

export function adminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("/v1/admin/marketer-dashboard/stats");
}

export interface SummaryQuery {
  marketerId?: string;
  facilityId?: string;
  /** yyyy-mm-dd (Africa/Lagos). Omit everything for today. */
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function activitySummary(
  role: SessionRole,
  query: SummaryQuery = {},
): Promise<ActivitySummary> {
  const path =
    role === "ADMIN"
      ? "/v1/admin/marketer-dashboard/summary"
      : "/v1/marketer/dashboard/summary";

  return apiFetch<ActivitySummary>(path, {
    query: {
      marketer_id: query.marketerId,
      facility_id: query.facilityId,
      date: query.date,
      date_from: query.dateFrom,
      date_to: query.dateTo,
    },
  });
}
