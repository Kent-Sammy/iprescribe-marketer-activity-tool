/**
 * Date/time helpers pinned to the app timezone (Africa/Lagos).
 *
 * All timestamps in the data are ISO strings (UTC). Everything the user sees —
 * and every "today" / "this week" boundary — is computed in Africa/Lagos so a
 * marketer's day and an admin's day always agree.
 */

export const APP_TIMEZONE = "Africa/Lagos";

/** yyyy-mm-dd for the given date, in the app timezone. */
export function toAppYMD(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // en-CA formats as yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(d);
}

export function todayYMD(): string {
  return toAppYMD(new Date());
}

/** "1 Sep 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "Monday, 1 September 2026" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "9:15 AM" */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** "1 Sep 2026, 9:15 AM" */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function isSameAppDay(a: Date | string, b: Date | string): boolean {
  return toAppYMD(a) === toAppYMD(b);
}

export function isToday(date: Date | string): boolean {
  return toAppYMD(date) === todayYMD();
}

/** Monday-anchored week key (the yyyy-mm-dd of that week's Monday, app tz). */
export function appWeekStartYMD(date: Date | string = new Date()): string {
  const ymd = toAppYMD(date);
  const [y, m, d] = ymd.split("-").map(Number);
  // Treat the ymd as a UTC calendar date purely for weekday math.
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0 = Sun
  const diff = (dow + 6) % 7; // days since Monday
  base.setUTCDate(base.getUTCDate() - diff);
  return base.toISOString().slice(0, 10);
}

export function isThisWeek(date: Date | string): boolean {
  return appWeekStartYMD(date) === appWeekStartYMD(new Date());
}

/** Relative-ish label for "last activity" columns. */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24 && isToday(d)) return `${hours} hr ago`;
  if (isToday(d)) return `today, ${formatTime(d)}`;
  const days = Math.round(hours / 24);
  if (days === 1) return `yesterday, ${formatTime(d)}`;
  if (days < 7) return `${days} days ago`;
  return formatDate(d);
}

/** Compare helper for sorting newest-first. */
export function byNewest<T extends { createdAt: string }>(a: T, b: T): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
