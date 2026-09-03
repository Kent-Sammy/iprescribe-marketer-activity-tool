"use client";

/**
 * Live data store, backed by the iPrescribe API.
 *
 * Loads the collections a session is allowed to see once, keeps them in React
 * state, and applies writes optimistically-after-confirm (the server's row is
 * what lands in state, never a locally-built guess). The selector hooks below
 * are the ones every screen already uses.
 *
 * Reads are scoped by role: a marketer gets their own reports, an admin gets
 * the whole team's. That scoping is enforced server-side too — the marketer
 * endpoints ignore any marketer id sent from here.
 *
 * The dashboards filter and aggregate these arrays client-side via
 * `src/lib/reporting.ts`. For workspaces large enough that downloading the full
 * report set stops being reasonable, the API exposes the same filters and
 * summaries server-side — see `src/lib/api/reports.ts` and
 * `src/lib/api/dashboard.ts` — and screens can move over one at a time.
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
import type { Facility, Marketer, Report } from "@/lib/types";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import {
  createFacility,
  listFacilities,
  type NewFacilityInput,
} from "@/lib/api/facilities";
import {
  completeFollowUp as apiCompleteFollowUp,
  createReport,
  listReports,
  type NewReportInput,
} from "@/lib/api/reports";
import { listMarketers } from "@/lib/api/marketers";

export type { NewFacilityInput, NewReportInput };

interface DataState {
  marketers: Marketer[];
  facilities: Facility[];
  reports: Report[];
}

const EMPTY: DataState = { marketers: [], facilities: [], reports: [] };

interface StoreValue extends DataState {
  /** True once the first load has settled — success or failure. */
  hydrated: boolean;
  /** Message from the last failed load, if any. */
  error: string | null;
  refresh: () => Promise<void>;
  addFacility: (input: NewFacilityInput) => Promise<Facility>;
  addReport: (input: NewReportInput) => Promise<Report>;
  completeFollowUp: (reportId: string) => Promise<Report>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DataState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = session?.user.role;
  const sessionUserId = session?.user.id;
  const sessionMarketer = session?.marketer;

  const load = useCallback(async () => {
    if (!role) return;

    const [facilities, reports, marketers] = await Promise.all([
      listFacilities(role),
      listReports(role),
      role === "ADMIN"
        ? listMarketers()
        : Promise.resolve(sessionMarketer ? [sessionMarketer] : []),
    ]);

    setData({ facilities, reports, marketers });
  }, [role, sessionMarketer]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setData(EMPTY);
      setError(null);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);

    load()
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setData(EMPTY);
        setError(
          e instanceof ApiError ? e.displayMessage : "Couldn't load your data. Try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
    // sessionUserId re-runs the load when the signed-in person changes.
  }, [status, sessionUserId, load]);

  const refresh = useCallback(async () => {
    try {
      await load();
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.displayMessage : "Couldn't refresh. Try again.");
    }
  }, [load]);

  const addFacility = useCallback(async (input: NewFacilityInput): Promise<Facility> => {
    const facility = await createFacility(input);
    setData((d) => ({ ...d, facilities: [facility, ...d.facilities] }));
    return facility;
  }, []);

  const addReport = useCallback(async (input: NewReportInput): Promise<Report> => {
    const report = await createReport(input);
    setData((d) => ({ ...d, reports: [report, ...d.reports] }));
    return report;
  }, []);

  const completeFollowUp = useCallback(async (reportId: string): Promise<Report> => {
    const updated = await apiCompleteFollowUp(reportId);
    setData((d) => ({
      ...d,
      reports: d.reports.map((r) => (r.id === updated.id ? updated : r)),
    }));
    return updated;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      error,
      refresh,
      addFacility,
      addReport,
      completeFollowUp,
    }),
    [data, hydrated, error, refresh, addFacility, addReport, completeFollowUp],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Data hooks must be used inside <DataProvider>");
  return ctx;
}

/* --------------------------- selector hooks ---------------------------- */

export function useDataStore() {
  return useStore();
}

export function useHydrated(): boolean {
  return useStore().hydrated;
}

export function useLoadError(): string | null {
  return useStore().error;
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
