/**
 * Domain types for the Marketer Activity Tool.
 *
 * These mirror the approved database schema (see the technical plan). When the
 * backend lands, these interfaces should stay largely the same — only the data
 * source changes (Prisma instead of the mock store).
 */

export type Role = "MARKETER" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type FacilityType = "PHARMACY" | "HOSPITAL_CLINIC" | "LABORATORY";

export type ContactRole =
  | "DOCTOR"
  | "PHARMACIST"
  | "LAB_TECHNICIAN"
  | "FACILITY_MANAGER"
  | "OTHER";

export type Outcome =
  | "INTERESTED"
  | "FOLLOW_UP_REQUIRED"
  | "CONVERTED"
  | "NOT_INTERESTED"
  | "NO_DECISION_MAKER"
  | "OTHER";

/** How a report's location was obtained. Saved reports are always CAPTURED
 *  because submission is blocked otherwise, but the enum is kept for the future. */
export type LocationStatus = "CAPTURED" | "DENIED" | "UNAVAILABLE" | "SKIPPED";

export interface Marketer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  /** ISO string */
  createdAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPersonName?: string;
  contactPersonRole?: ContactRole;
  contactPhone?: string;
  /** Marketer id of whoever added the facility */
  createdById: string;
  /** ISO string */
  createdAt: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  /** metres */
  accuracy: number;
  /** ISO string — reading timestamp */
  capturedAt: string;
  /** Best-effort reverse-geocoded address */
  address?: string;
}

export interface Report {
  id: string;
  marketerId: string;
  facilityId: string;
  /** Facility type copied at submit time so history stays accurate */
  facilityTypeSnapshot: FacilityType;
  contactName: string;
  /** Phone number of the person contacted — required, used for follow-up. */
  contactPhone: string;
  contactRole: ContactRole;
  /** Optional facility owner — a DIFFERENT contact from the person contacted. */
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  outcome: Outcome;
  followUpRequired: boolean;
  /** ISO date (yyyy-mm-dd) when a follow-up is due */
  followUpDate?: string;
  /** ISO string when the marketer marked the follow-up done */
  followUpCompletedAt?: string;
  remarks: string;
  location: GeoLocation;
  locationStatus: LocationStatus;
  /** ISO string — the report / visit date & time (never user-entered) */
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Label maps — the single source of truth for human-readable enum text     */
/* -------------------------------------------------------------------------- */

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  PHARMACY: "Pharmacy",
  HOSPITAL_CLINIC: "Hospital / Clinic",
  LABORATORY: "Laboratory",
};

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  DOCTOR: "Doctor",
  PHARMACIST: "Pharmacist",
  LAB_TECHNICIAN: "Lab Technician",
  FACILITY_MANAGER: "Facility Manager",
  OTHER: "Other",
};

export const OUTCOME_LABELS: Record<Outcome, string> = {
  INTERESTED: "Interested",
  FOLLOW_UP_REQUIRED: "Follow-up Required",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
  NO_DECISION_MAKER: "No Decision Maker Available",
  OTHER: "Other",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export type BadgeTone = "neutral" | "success" | "warning" | "destructive" | "info";

export const OUTCOME_TONE: Record<Outcome, BadgeTone> = {
  INTERESTED: "info",
  FOLLOW_UP_REQUIRED: "warning",
  CONVERTED: "success",
  NOT_INTERESTED: "destructive",
  NO_DECISION_MAKER: "neutral",
  OTHER: "neutral",
};

export const FACILITY_TYPE_OPTIONS = (
  Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]
).map((value) => ({ value, label: FACILITY_TYPE_LABELS[value] }));

export const CONTACT_ROLE_OPTIONS = (
  Object.keys(CONTACT_ROLE_LABELS) as ContactRole[]
).map((value) => ({ value, label: CONTACT_ROLE_LABELS[value] }));

export const OUTCOME_OPTIONS = (Object.keys(OUTCOME_LABELS) as Outcome[]).map(
  (value) => ({ value, label: OUTCOME_LABELS[value] }),
);
