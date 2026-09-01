import { Badge } from "@/components/ui/badge";
import {
  CONTACT_ROLE_LABELS,
  FACILITY_TYPE_LABELS,
  OUTCOME_LABELS,
  OUTCOME_TONE,
  USER_STATUS_LABELS,
  type ContactRole,
  type FacilityType,
  type Outcome,
  type Report,
  type Role,
  type UserStatus,
} from "@/lib/types";
import { followUpLabel } from "@/lib/reporting";

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <Badge tone={OUTCOME_TONE[outcome]}>{OUTCOME_LABELS[outcome]}</Badge>;
}

export function FacilityTypeBadge({ type }: { type: FacilityType }) {
  return <Badge tone="neutral">{FACILITY_TYPE_LABELS[type]}</Badge>;
}

export function ContactRoleBadge({ role }: { role: ContactRole }) {
  return <Badge tone="outline">{CONTACT_ROLE_LABELS[role]}</Badge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={role === "ADMIN" ? "info" : "neutral"}>{role === "ADMIN" ? "Admin" : "Marketer"}</Badge>;
}

export function FollowUpBadge({ report }: { report: Report }) {
  const label = followUpLabel(report);
  const tone =
    label === "Overdue"
      ? "destructive"
      : label === "Open"
        ? "warning"
        : label === "Completed"
          ? "success"
          : "neutral";
  return <Badge tone={tone}>{label === "None" ? "—" : label}</Badge>;
}
