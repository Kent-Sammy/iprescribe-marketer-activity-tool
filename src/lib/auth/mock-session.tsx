"use client";

/**
 * MOCK session — frontend-prototype phase.
 *
 * There is NO real authentication here. The login page calls loginAsMarketer()
 * or loginAsAdmin() and navigates; the chosen role is kept in localStorage so
 * the app shell renders the right label and role-aware UI works. No account, no
 * password, no verification, no route guards.
 *
 * To reintroduce real auth later: swap this module back to a Clerk adapter,
 * re-add <ClerkProvider> in app/layout.tsx, and restore src/middleware.ts.
 * The exported hook names / `SessionUser` shape are kept stable so feature
 * components don't need to change.
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
import { MOCK_MARKETERS } from "@/lib/mock/data";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Present only for marketers. */
  marketerId?: string;
}

export interface Session {
  user: SessionUser;
}

type Status = "authenticated" | "loading" | "unauthenticated";
type Kind = "marketer" | "admin";

const STORAGE_KEY = "mat_prototype_session_v1";
const DEFAULT_MARKETER = MOCK_MARKETERS[0];

function marketerSession(): Session {
  return {
    user: {
      id: DEFAULT_MARKETER.id,
      name: DEFAULT_MARKETER.name,
      email: DEFAULT_MARKETER.email,
      role: "MARKETER",
      marketerId: DEFAULT_MARKETER.id,
    },
  };
}

function adminSession(): Session {
  return {
    user: {
      id: "admin",
      name: "Admin",
      email: "admin@example.com",
      role: "ADMIN",
    },
  };
}

const DEFAULT_SESSION = marketerSession();

interface AuthContextValue {
  session: Session;
  status: Status;
  loginAsMarketer: () => void;
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
      if (raw === "admin") setSession(adminSession());
      else if (raw === "marketer") setSession(marketerSession());
    } catch {
      // ignore — fall back to default
    }
    setStatus("authenticated");
  }, []);

  const persist = useCallback((kind: Kind) => {
    try {
      localStorage.setItem(STORAGE_KEY, kind);
    } catch {
      // ignore
    }
    setSession(kind === "admin" ? adminSession() : marketerSession());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      loginAsMarketer: () => persist("marketer"),
      loginAsAdmin: () => persist("admin"),
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
    throw new Error("useSession/useCurrentUser must be used inside <MockSessionProvider>");
  }
  return ctx;
}

/** next-auth-compatible shape: `{ data, status }`. */
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
