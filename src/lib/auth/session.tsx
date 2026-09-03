"use client";

/**
 * Session state, backed by the iPrescribe API.
 *
 * On mount the provider looks for a stored token pair and re-resolves the
 * session against `/auth/me`; a token that no longer works is discarded and the
 * app falls back to unauthenticated. Marketers and admins are distinct API
 * actors, so logging in is `signInAsMarketer` or `signInAsAdmin`, never one
 * call with a role flag.
 *
 * Screens under <RequireRole> can rely on `useCurrentUser()` returning a user;
 * everything else should read `useSession()` and handle the null case.
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
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/api/client";
import {
  fetchSession,
  loginAdmin,
  loginMarketer,
  logout as apiLogout,
  registerMarketer,
  type AuthSession,
  type RegisterMarketerInput,
  type SessionUser,
} from "@/lib/api/auth";
import type { Role } from "@/lib/types";

export type { AuthSession, SessionUser };

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  session: AuthSession | null;
  status: SessionStatus;
  signInAsMarketer: (email: string, password: string) => Promise<AuthSession>;
  signUpAsMarketer: (input: RegisterMarketerInput) => Promise<AuthSession>;
  signInAsAdmin: (email: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    const stored = tokenStore.read();
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;
    fetchSession(stored.role)
      .then((resolved) => {
        if (cancelled) return;
        setSession(resolved);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        tokenStore.clear();
        setSession(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((resolved: AuthSession): AuthSession => {
    setSession(resolved);
    setStatus("authenticated");
    return resolved;
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      status,
      signInAsMarketer: async (email, password) => adopt(await loginMarketer(email, password)),
      signUpAsMarketer: async (input) => adopt(await registerMarketer(input)),
      signInAsAdmin: async (email, password) => adopt(await loginAdmin(email, password)),
      signOut: async () => {
        const role = session?.user.role ?? tokenStore.read()?.role;
        if (role) await apiLogout(role);
        else tokenStore.clear();
        setSession(null);
        setStatus("unauthenticated");
      },
    }),
    [session, status, adopt],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("Session hooks must be used inside <SessionProvider>");
  return ctx;
}

/** next-auth-compatible shape: `{ data, status }`. */
export function useSession(): { data: AuthSession | null; status: SessionStatus } {
  const { session, status } = useSessionContext();
  return { data: session, status };
}

/**
 * The signed-in user. Only safe under <RequireRole> — everywhere else, read
 * `useSession()` and handle the unauthenticated case.
 */
export function useCurrentUser(): SessionUser {
  const { session } = useSessionContext();
  if (!session) {
    throw new Error("useCurrentUser() requires an authenticated session — wrap in <RequireRole>");
  }
  return session.user;
}

export function useAuthActions() {
  const { signInAsMarketer, signUpAsMarketer, signInAsAdmin, signOut } = useSessionContext();
  return { signInAsMarketer, signUpAsMarketer, signInAsAdmin, signOut };
}

/**
 * Route guard: sends anyone without the required role to /login, and holds the
 * screen on a spinner while the stored token is being re-resolved.
 */
export function RequireRole({
  role,
  children,
  fallback,
}: {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { session, status } = useSessionContext();
  const router = useRouter();
  const allowed = status === "authenticated" && session?.user.role === role;

  useEffect(() => {
    if (status === "loading" || allowed) return;
    // A signed-in user on the wrong side of the app goes to their own home.
    const destination =
      status === "authenticated"
        ? session?.user.role === "ADMIN"
          ? "/admin"
          : "/dashboard"
        : "/login";
    router.replace(destination);
  }, [status, allowed, session?.user.role, router]);

  if (!allowed) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
