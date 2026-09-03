/**
 * HTTP client for the iPrescribe API.
 *
 * The API wraps every response in `{ data, message, status }` and every error in
 * `{ message, errors?, error: true }`, so `apiFetch` unwraps `data` on success
 * and throws an {@link ApiError} carrying the field errors otherwise.
 *
 * Auth is a Passport bearer token plus a rotating refresh token, both kept in
 * localStorage. A 401 on an authenticated call triggers one refresh-and-retry;
 * if that fails the session is cleared and the caller sees the 401.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api").replace(
  /\/$/,
  "",
);

export type SessionRole = "MARKETER" | "ADMIN";

/* ------------------------------ token storage ----------------------------- */

const ACCESS_KEY = "mat_access_token";
const REFRESH_KEY = "mat_refresh_token";
const ROLE_KEY = "mat_session_role";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  role: SessionRole;
}

export const tokenStore = {
  read(): StoredTokens | null {
    if (typeof window === "undefined") return null;
    try {
      const accessToken = localStorage.getItem(ACCESS_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      const role = localStorage.getItem(ROLE_KEY) as SessionRole | null;
      if (!accessToken || !refreshToken || !role) return null;
      return { accessToken, refreshToken, role };
    } catch {
      return null;
    }
  },

  write(tokens: StoredTokens): void {
    try {
      localStorage.setItem(ACCESS_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
      localStorage.setItem(ROLE_KEY, tokens.role);
    } catch {
      // private mode / quota — the session simply won't survive a reload
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(ROLE_KEY);
    } catch {
      // ignore
    }
  },
};

/* --------------------------------- errors -------------------------------- */

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Flattened validation messages, best for showing under a form. */
  get fieldMessages(): string[] {
    return Object.values(this.errors ?? {}).flat();
  }

  /** The message worth showing a user — the first field error, else the summary. */
  get displayMessage(): string {
    return this.fieldMessages[0] ?? this.message;
  }
}

/* -------------------------------- requests -------------------------------- */

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Send the bearer token. Off for login/register/refresh. */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** In-flight refresh, so parallel 401s queue behind one rotation. */
let refreshInFlight: Promise<StoredTokens | null> | null = null;

async function refreshSession(): Promise<StoredTokens | null> {
  const stored = tokenStore.read();
  if (!stored) return null;

  const path =
    stored.role === "ADMIN" ? "/v1/admin/auth/refresh-token" : "/v1/marketer/auth/refresh-token";

  try {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });
    if (!response.ok) throw new Error("refresh failed");

    const payload = await response.json();
    const next: StoredTokens = {
      accessToken: payload.data.token,
      refreshToken: payload.data.refresh_token,
      role: stored.role,
    };
    tokenStore.write(next);
    return next;
  } catch {
    tokenStore.clear();
    return null;
  }
}

async function send(path: string, options: RequestOptions, token?: string) {
  const { method = "GET", body, query, signal } = options;

  return fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;

  let token = auth ? tokenStore.read()?.accessToken : undefined;
  let response = await send(path, options, token);

  // One refresh-and-retry, shared across concurrent callers.
  if (response.status === 401 && auth && tokenStore.read()) {
    refreshInFlight = refreshInFlight ?? refreshSession();
    const refreshed = await refreshInFlight;
    refreshInFlight = null;

    if (refreshed) {
      token = refreshed.accessToken;
      response = await send(path, options, token);
    }
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.errors,
    );
  }

  return payload?.data as T;
}

/* ------------------------------- pagination ------------------------------- */

/** Laravel's length-aware paginator, as it arrives inside `data`. */
export interface Paginated<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}

/** The API caps `limit` at 200 per page. */
const MAX_PER_PAGE = 200;
/** Safety valve so a runaway dataset can't hang the browser. */
const MAX_PAGES = 25;

/**
 * Walk every page of a paginated endpoint into one array.
 *
 * The dashboards filter and aggregate client-side (see `src/lib/reporting.ts`),
 * so they need the whole collection. If a workspace ever outgrows
 * MAX_PER_PAGE * MAX_PAGES rows, move those screens onto the server-side
 * filter/summary endpoints instead of raising the cap.
 */
export async function fetchAll<T>(
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  for (;;) {
    const result = await apiFetch<Paginated<T>>(path, {
      query: { ...query, limit: MAX_PER_PAGE, page },
    });
    items.push(...(result?.data ?? []));

    if (!result || page >= result.last_page || page >= MAX_PAGES) break;
    page += 1;
  }

  return items;
}
