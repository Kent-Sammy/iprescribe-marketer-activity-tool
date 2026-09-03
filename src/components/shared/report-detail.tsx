"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, CheckCircle2, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { LocationDetails } from "@/components/shared/location-details";
import {
  ContactRoleBadge,
  FacilityTypeBadge,
  FollowUpBadge,
  OutcomeBadge,
} from "@/components/shared/badges";
import { formatDate, formatDateTime, formatTime } from "@/lib/datetime";
import { isFollowUpOpen } from "@/lib/reporting";
import {
  useFacility,
  useHydrated,
  useMarketer,
  useDataStore,
  useReport,
} from "@/lib/data/store";
import { useCurrentUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/client";

interface ReportDetailProps {
  reportId: string;
  context: "marketer" | "admin";
}

export function ReportDetail({ reportId, context }: ReportDetailProps) {
  const hydrated = useHydrated();
  const report = useReport(reportId);
  const facility = useFacility(report?.facilityId);
  const marketer = useMarketer(report?.marketerId);
  const { completeFollowUp } = useDataStore();
  const user = useCurrentUser();
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  if (!hydrated) return <PageLoading />;

  const backHref = context === "admin" ? "/admin/reports" : "/reports";

  if (!report) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <EmptyState
          icon={FileQuestion}
          title="Report not found"
          description="It may have been removed, or the link is out of date."
        />
      </div>
    );
  }

  const canCompleteFollowUp =
    context === "marketer" &&
    isFollowUpOpen(report) &&
    user.marketerId === report.marketerId;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <PageHeader
        title={facility?.name ?? "Report"}
        description={`${formatDate(report.createdAt)} · ${formatTime(report.createdAt)}`}
        actions={<OutcomeBadge outcome={report.outcome} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visit details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Facility">
                {context === "admin" && facility ? (
                  <Link
                    href={`/admin/facilities/${facility.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {facility.name}
                  </Link>
                ) : (
                  <span className="font-medium">{facility?.name ?? "—"}</span>
                )}
              </Field>
              <Field label="Facility type">
                <FacilityTypeBadge type={report.facilityTypeSnapshot} />
              </Field>
              <Field label="Person contacted">
                <div className="font-medium">{report.contactName}</div>
                <div className="mt-1">
                  <ContactRoleBadge role={report.contactRole} />
                </div>
              </Field>
              <Field label="Phone number">
                {report.contactPhone ? (
                  <a
                    href={`tel:${report.contactPhone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {report.contactPhone}
                  </a>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Marketer">
                {context === "admin" && marketer ? (
                  <Link
                    href={`/admin/marketers/${marketer.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {marketer.name}
                  </Link>
                ) : (
                  <span className="font-medium">{marketer?.name ?? "—"}</span>
                )}
              </Field>
              <Field label="Submitted">{formatDateTime(report.createdAt)}</Field>
            </dl>

            {report.ownerName || report.ownerPhone || report.ownerEmail ? (
              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-2">
                {report.ownerName ? (
                  <Field label="Facility owner">
                    <span className="font-medium">{report.ownerName}</span>
                  </Field>
                ) : null}
                {report.ownerPhone ? (
                  <Field label="Owner phone">
                    <a
                      href={`tel:${report.ownerPhone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {report.ownerPhone}
                    </a>
                  </Field>
                ) : null}
                {report.ownerEmail ? (
                  <Field label="Owner email">
                    <a
                      href={`mailto:${report.ownerEmail}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {report.ownerEmail}
                    </a>
                  </Field>
                ) : null}
              </dl>
            ) : null}

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Remarks
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{report.remarks}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationDetails location={report.location} />
            </CardContent>
          </Card>

          {report.followUpRequired ? (
            <Card>
              <CardHeader>
                <CardTitle>Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <FollowUpBadge report={report} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span>
                    {report.followUpDate ? formatDate(report.followUpDate) : "—"}
                  </span>
                </div>
                {report.followUpCompletedAt ? (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed {formatDateTime(report.followUpCompletedAt)}
                  </div>
                ) : null}
                {completeError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {completeError}
                  </p>
                ) : null}
                {canCompleteFollowUp ? (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={completing}
                    onClick={async () => {
                      setCompleting(true);
                      setCompleteError(null);
                      try {
                        await completeFollowUp(report.id);
                      } catch (e) {
                        setCompleteError(
                          e instanceof ApiError
                            ? e.displayMessage
                            : "Couldn't mark the follow-up complete. Try again.",
                        );
                      } finally {
                        setCompleting(false);
                      }
                    }}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    {completing ? "Saving…" : "Mark follow-up complete"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
