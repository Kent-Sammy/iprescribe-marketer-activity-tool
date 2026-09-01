"use client";

/**
 * MOCK data store.
 *
 * Holds marketers / facilities / reports in React state, seeded from
 * `buildSeed()` and persisted to localStorage so a submitted report survives a
 * reload and shows up in every screen.
 *
 * Replace with real data fetching later:
 *  - reads  -> server components calling `src/lib/services/*`
 *  - writes -> server actions
 * The hook names (`useReports`, `useFacilities`, ...) can be kept as thin
 * client wrappers over the real API if convenient.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ContactRole, Facility, FacilityType, Marketer, Outcome, Report } from "@/lib/types";
import { buildSeed, type MockDataset } from "@/lib/mock/data";

const STORAGE_KEY = "mat_mock_data_v1";

export interface NewFacilityInput {
  name: string;
  type: FacilityType;
  address?: string;
  contactPersonName?: string;
  contactPersonRole?: ContactRole;
  contactPhone?: string;
  createdById: string;
}

export interface NewReportInput {
  marketerId: string;
  facilityId: string;
  facilityTypeSnapshot: FacilityType;
  contactName: string;
  contactRole: ContactRole;
  outcome: Outcome;
  followUpDate?: string;
  remarks: string;
  location: Report["location"];
}

interface StoreValue extends MockDataset {
  hydrated: boolean;
  addFacility: (input: NewFacilityInput) => Facility;
  addReport: (input: NewReportInput) => Report;
  completeFollowUp: (reportId: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadPersisted(): MockDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDataset;
    if (!parsed.marketers || !parsed.facilities || !parsed.reports) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MockDataset>(() => buildSeed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) setData(persisted);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [data, hydrated]);

  const addFacility = useCallback((input: NewFacilityInput): Facility => {
    const facility: Facility = {
      id: `fac_new_${Date.now().toString(36)}`,
      name: input.name.trim(),
      type: input.type,
      address: input.address?.trim() || undefined,
      contactPersonName: input.contactPersonName?.trim() || undefined,
      contactPersonRole: input.contactPersonRole,
      contactPhone: input.contactPhone?.trim() || undefined,
      createdById: input.createdById,
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, facilities: [facility, ...d.facilities] }));
    return facility;
  }, []);

  const addReport = useCallback((input: NewReportInput): Report => {
    const now = new Date().toISOString();
    const report: Report = {
      id: `rep_new_${Date.now().toString(36)}`,
      marketerId: input.marketerId,
      facilityId: input.facilityId,
      facilityTypeSnapshot: input.facilityTypeSnapshot,
      contactName: input.contactName.trim(),
      contactRole: input.contactRole,
      outcome: input.outcome,
      followUpRequired: input.outcome === "FOLLOW_UP_REQUIRED",
      followUpDate: input.outcome === "FOLLOW_UP_REQUIRED" ? input.followUpDate : undefined,
      followUpCompletedAt: undefined,
      remarks: input.remarks.trim(),
      location: input.location,
      locationStatus: "CAPTURED",
      createdAt: now,
    };
    setData((d) => ({ ...d, reports: [report, ...d.reports] }));
    return report;
  }, []);

  const completeFollowUp = useCallback((reportId: string) => {
    setData((d) => ({
      ...d,
      reports: d.reports.map((r) =>
        r.id === reportId && r.followUpRequired && !r.followUpCompletedAt
          ? { ...r, followUpCompletedAt: new Date().toISOString() }
          : r,
      ),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = buildSeed();
    setData(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      addFacility,
      addReport,
      completeFollowUp,
      resetDemoData,
    }),
    [data, hydrated, addFacility, addReport, completeFollowUp, resetDemoData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Mock data hooks must be used inside <MockDataProvider>");
  return ctx;
}

/* --------------------------- selector hooks ---------------------------- */

export function useMockStore() {
  return useStore();
}

export function useHydrated(): boolean {
  return useStore().hydrated;
}

export function useMarketers(): Marketer[] {
  return useStore().marketers;
}

export function useMarketer(id: string | undefined): Marketer | undefined {
  const { marketers } = useStore();
  return marketers.find((m) => m.id === id);
}

export function useFacilities(): Facility[] {
  return useStore().facilities;
}

export function useFacility(id: string | undefined): Facility | undefined {
  const { facilities } = useStore();
  return facilities.find((f) => f.id === id);
}

export function useReports(): Report[] {
  return useStore().reports;
}

export function useReport(id: string | undefined): Report | undefined {
  const { reports } = useStore();
  return reports.find((r) => r.id === id);
}
