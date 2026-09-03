/**
 * Facility directory endpoints.
 *
 * Marketers and admins hit different prefixes for the same data: a marketer can
 * add a facility from the field, an admin is read-only.
 */

import { apiFetch, fetchAll, type SessionRole } from "@/lib/api/client";
import type { ContactRole, Facility, FacilityType } from "@/lib/types";

export interface FacilityFilters {
  search?: string;
  type?: FacilityType;
}

function prefix(role: SessionRole): string {
  return role === "ADMIN" ? "/v1/admin/marketer-facilities" : "/v1/marketer/facilities";
}

export function listFacilities(
  role: SessionRole,
  filters: FacilityFilters = {},
): Promise<Facility[]> {
  return fetchAll<Facility>(prefix(role), { ...filters, sort: "name", order: "asc" });
}

export function getFacility(role: SessionRole, id: string): Promise<Facility> {
  return apiFetch<Facility>(`${prefix(role)}/${id}`);
}

export interface NewFacilityInput {
  name: string;
  type: FacilityType;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPersonName?: string;
  contactPersonRole?: ContactRole;
  contactPhone?: string;
}

/** Marketers only — the admin routes are read-only by design. */
export function createFacility(input: NewFacilityInput): Promise<Facility> {
  return apiFetch<Facility>("/v1/marketer/facilities", { method: "POST", body: input });
}
