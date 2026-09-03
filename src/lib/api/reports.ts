/**
 * Visit report endpoints.
 *
 * The marketer routes are force-scoped to the logged-in marketer server-side —
 * passing a marketerId there would be ignored. The admin routes read across the
 * whole team and accept `marketer_id` as a filter.
 */

import { apiFetch, fetchAll, type SessionRole } from "@/lib/api/client";
import type { ContactRole, FacilityType, GeoLocation, Outcome, Report } from "@/lib/types";

export interface ReportQuery {
  marketerId?: string;
  facilityId?: string;
  facilityType?: FacilityType;
  outcome?: Outcome;
  followUp?: "REQUIRED" | "OPEN" | "COMPLETED" | "NONE";
  /** yyyy-mm-dd (Africa/Lagos) */
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

function prefix(role: SessionRole): string {
  return role === "ADMIN" ? "/v1/admin/marketer-reports" : "/v1/marketer/reports";
}

function toQuery(query: ReportQuery) {
  return {
    marketer_id: query.marketerId,
    facility_id: query.facilityId,
    facility_type: query.facilityType,
    outcome: query.outcome,
    follow_up: query.followUp,
    date: query.date,
    date_from: query.dateFrom,
    date_to: query.dateTo,
    search: query.search,
  };
}

export function listReports(role: SessionRole, query: ReportQuery = {}): Promise<Report[]> {
  return fetchAll<Report>(prefix(role), toQuery(query));
}

export function getReport(role: SessionRole, id: string): Promise<Report> {
  return apiFetch<Report>(`${prefix(role)}/${id}`);
}

export interface NewReportInput {
  facilityId: string;
  contactName: string;
  contactPhone: string;
  contactRole: ContactRole;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  outcome: Outcome;
  /** yyyy-mm-dd — required when the outcome is FOLLOW_UP_REQUIRED. */
  followUpDate?: string;
  remarks: string;
  location: GeoLocation;
}

/**
 * Submit a report. The marketer, the visit timestamp and the facility type
 * snapshot are all set server-side — never sent from here.
 */
export function createReport(input: NewReportInput): Promise<Report> {
  return apiFetch<Report>("/v1/marketer/reports", { method: "POST", body: input });
}

/** Marketers close out their own follow-ups; admins cannot. */
export function completeFollowUp(reportId: string): Promise<Report> {
  return apiFetch<Report>(`/v1/marketer/reports/${reportId}/complete-follow-up`, {
    method: "POST",
  });
}
