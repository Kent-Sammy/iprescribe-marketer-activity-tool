"use client";

/**
 * MOCK authentication.
 *
 * There is no password, database, JWT, or Auth.js here. This module fakes a
 * signed-in user and lets you switch between the marketer and admin experiences
 * freely. No route is guarded.
 *
 * ---------------------------------------------------------------------------
 * REPLACING THIS WITH REAL AUTH.JS LATER
 * ---------------------------------------------------------------------------
 * - Swap <MockSessionProvider> for next-auth's <SessionProvider>.
 * - Replace `useSession()` below with `import { useSession } from "next-auth/react"`.
 *   The returned shape ({ data, status }) is intentionally the same.
 * - Replace `useAuthActions()` callers:
 *     loginAsMarketer / loginAsAdmin  -> a real credentials sign-in form
 *     signOut                         -> next-auth `signOut()`
 * - Delete <RoleSwitcher> (dev-only) and re-introduce middleware + per-service
 *   role checks. Components that read `session.user.role` / `.marketerId` keep
 *   working unchanged.
 * ---------------------------------------------------------------------------
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
import type { Role } from "@/lib/types";
import { MOCK_ADMIN, MOCK_MARKETERS } from "@/lib/mock/data";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Present only when role === "MARKETER". */
  marketerId?: string;
}

export interface Session {
  user: SessionUser;
}

type Status = "authenticated" | "loading" | "unauthenticated";

const STORAGE_KEY = "mat_mock_session_v1";

function marketerSession(marketerId: string): Session {
  const m = MOCK_MARKETERS.find((x) => x.id === marketerId) ?? MOCK_MARKETERS[0];
  return {
    user: {
      id: m.id,
      name: m.name,
      email: m.email,
      role: "MARKETER",
      marketerId: m.id,
    },
  };
}

function adminSession(): Session {
  return {
    user: {
      id: MOCK_ADMIN.id,
      name: MOCK_ADMIN.name,
      email: MOCK_ADMIN.email,
      role: "ADMIN",
    },
  };
}

/** Default identity so deep links work before anyone "logs in". */
const DEFAULT_SESSION = marketerSession(MOCK_MARKETERS[0].id);

interface AuthContextValue {
  session: Session;
  status: Status;
  loginAsMarketer: (marketerId: string) => void;
  loginAsAdmin: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      // ignore — fall back to default
    }
    setStatus("authenticated");
  }, []);

  const persist = useCallback((next: Session) => {
    setSession(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      loginAsMarketer: (marketerId: string) => persist(marketerSession(marketerId)),
      loginAsAdmin: () => persist(adminSession()),
      signOut: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setSession(DEFAULT_SESSION);
      },
    }),
    [session, status, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth* must be used inside <MockSessionProvider>");
  }
  return ctx;
}

/** next-auth-compatible shape: { data, status }. */
export function useSession(): { data: Session; status: Status } {
  const { session, status } = useAuthContext();
  return { data: session, status };
}

export function useCurrentUser(): SessionUser {
  return useAuthContext().session.user;
}

export function useAuthActions() {
  const { loginAsMarketer, loginAsAdmin, signOut } = useAuthContext();
  return { loginAsMarketer, loginAsAdmin, signOut };
}
