/**
 * Marketer roster endpoints (admin only).
 *
 * `listMarketerRows` returns the admin marketers table pre-aggregated by the
 * API — the same figures `marketerRows()` in `src/lib/reporting.ts` computes
 * client-side, for screens that would rather not download every report.
 */

import { apiFetch } from "@/lib/api/client";
import type { Marketer } from "@/lib/types";

export interface MarketerRow {
  marketer: Marketer;
  reportsToday: number;
  visitsThisWeek: number;
  lastActivityAt?: string;
}

export function listMarketerRows(search?: string): Promise<MarketerRow[]> {
  return apiFetch<MarketerRow[]>("/v1/admin/marketers", { query: { search } });
}

export async function listMarketers(): Promise<Marketer[]> {
  const rows = await listMarketerRows();
  return rows.map((row) => row.marketer);
}

export function getMarketer(id: string): Promise<Marketer> {
  return apiFetch<Marketer>(`/v1/admin/marketers/${id}`);
}

/** Dates (yyyy-mm-dd, Africa/Lagos) this marketer filed reports on, newest first. */
export function getActiveDates(marketerId: string): Promise<string[]> {
  return apiFetch<string[]>(`/v1/admin/marketers/${marketerId}/active-dates`);
}

export function setMarketerStatus(
  marketerId: string,
  status: Marketer["status"],
): Promise<Marketer> {
  return apiFetch<Marketer>(`/v1/admin/marketers/${marketerId}/status`, {
    method: "POST",
    body: { status },
  });
}

/** Admin-provisioned marketer account. */
export function createMarketer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<Marketer> {
  return apiFetch<Marketer>("/v1/admin/marketers", { method: "POST", body: input });
}

