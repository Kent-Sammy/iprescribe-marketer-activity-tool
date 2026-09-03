/**
 * Authentication endpoints.
 *
 * Marketers and admins are separate actors on the API — different tables,
 * different Passport guards, different route prefixes — so login is two calls,
 * not one call with a role flag. Both return the same token pair shape.
 */

import { apiFetch, tokenStore, type SessionRole } from "@/lib/api/client";
import type { Marketer, Role } from "@/lib/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Present only for marketers — their id in the marketers table. */
  marketerId?: string;
}

/**
 * A resolved session. `marketer` is the full record for a marketer session —
 * the API's marketer resource is already the `Marketer` domain type, so screens
 * that need more than the id (their roster row, for instance) can use it
 * without a second request.
 */
export interface AuthSession {
  user: SessionUser;
  marketer?: Marketer;
}

interface TokenPair {
  token: string;
  refresh_token: string;
}

interface MarketerAuthPayload extends TokenPair {
  user: Marketer;
}

interface AdminUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface AdminAuthPayload extends TokenPair {
  user: AdminUser;
}

function persist(payload: TokenPair, role: SessionRole): void {
  tokenStore.write({
    accessToken: payload.token,
    refreshToken: payload.refresh_token,
    role,
  });
}

function marketerSession(marketer: Marketer): AuthSession {
  return {
    user: {
      id: marketer.id,
      name: marketer.name,
      email: marketer.email,
      role: "MARKETER",
      marketerId: marketer.id,
    },
    marketer,
  };
}

function adminSession(user: AdminUser): AuthSession {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return {
    user: {
      id: user.id,
      name: name || "Admin",
      email: user.email,
      role: "ADMIN",
    },
  };
}

export async function loginMarketer(email: string, password: string): Promise<AuthSession> {
  const payload = await apiFetch<MarketerAuthPayload>("/v1/marketer/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  persist(payload, "MARKETER");
  return marketerSession(payload.user);
}

export interface RegisterMarketerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function registerMarketer(input: RegisterMarketerInput): Promise<AuthSession> {
  const payload = await apiFetch<MarketerAuthPayload>("/v1/marketer/auth/register", {
    method: "POST",
    auth: false,
    body: input,
  });
  persist(payload, "MARKETER");
  return marketerSession(payload.user);
}

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  const payload = await apiFetch<AdminAuthPayload>("/v1/admin/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  persist(payload, "ADMIN");
  return adminSession(payload.user);
}

/** Re-resolve the session from a stored token — used to restore it on reload. */
export async function fetchSession(role: SessionRole): Promise<AuthSession> {
  if (role === "ADMIN") {
    return adminSession(await apiFetch<AdminUser>("/v1/admin/auth/me"));
  }

  const payload = await apiFetch<{ user: Marketer }>("/v1/marketer/auth/me");
  return marketerSession(payload.user);
}

/** Best-effort server-side revoke; the local tokens are cleared either way. */
export async function logout(role: SessionRole): Promise<void> {
  const path = role === "ADMIN" ? "/v1/admin/auth/logout" : "/v1/marketer/auth/logout";
  try {
    await apiFetch(path, { method: "POST" });
  } catch {
    // an expired token can't be revoked — nothing to recover from
  } finally {
    tokenStore.clear();
  }
}
