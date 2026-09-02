"use client";

/**
 * Session adapter over Clerk.
 *
 * The rest of the app imports `useCurrentUser()` / `useSession()` /
 * `useAuthActions()` from here and expects the `SessionUser` shape below. This
 * module maps Clerk's `useUser()` / `useAuth()` / `useClerk()` onto that shape so
 * no feature component had to change when real auth landed.
 *
 * Role model: Clerk `publicMetadata.role === "admin"` -> ADMIN, otherwise
 * MARKETER. Admin accounts are stamped in the Clerk dashboard; marketer sign-up
 * needs no role handling.
 *
 * (Filename kept as `mock-session` to avoid churning ~9 imports; it is no longer
 * mock.)
 */

import type { ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import type { Role } from "@/lib/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Present only for marketers (equals the Clerk user id). */
  marketerId?: string;
}

export interface Session {
  user: SessionUser;
}

type Status = "authenticated" | "loading" | "unauthenticated";

function roleFrom(publicMetadata: unknown): Role {
  const role = (publicMetadata as { role?: string } | null | undefined)?.role;
  return role === "admin" ? "ADMIN" : "MARKETER";
}

type ClerkUserLike = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  publicMetadata: unknown;
  unsafeMetadata: unknown;
};

function toSessionUser(user: ClerkUserLike): SessionUser {
  const role = roleFrom(user.publicMetadata);
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const unsafeName = (user.unsafeMetadata as { fullName?: string } | null | undefined)
    ?.fullName;
  const name = user.fullName || unsafeName || user.firstName || email || "User";
  return {
    id: user.id,
    name,
    email,
    role,
    marketerId: role === "MARKETER" ? user.id : undefined,
  };
}

const FALLBACK_USER: SessionUser = {
  id: "",
  name: "",
  email: "",
  role: "MARKETER",
};

/**
 * Kept for backwards compatibility. Auth is provided by <ClerkProvider> in
 * app/layout.tsx, so this is a passthrough.
 */
export function MockSessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** next-auth-compatible shape: `{ data, status }`. */
export function useSession(): { data: Session | null; status: Status } {
  const { isLoaded } = useAuth();
  const { user } = useUser();
  if (!isLoaded) return { data: null, status: "loading" };
  if (!user) return { data: null, status: "unauthenticated" };
  return { data: { user: toSessionUser(user as unknown as ClerkUserLike) }, status: "authenticated" };
}

/**
 * The current user. On protected routes the middleware guarantees a session, so
 * once Clerk has loaded this is always the real user; during the brief load it
 * returns a neutral marketer placeholder.
 */
export function useCurrentUser(): SessionUser {
  const { user } = useUser();
  return user ? toSessionUser(user as unknown as ClerkUserLike) : FALLBACK_USER;
}

export function useAuthActions() {
  const { signOut } = useClerk();
  return {
    signOut: () => signOut({ redirectUrl: "/login" }),
  };
}
