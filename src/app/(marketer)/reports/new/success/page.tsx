"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/shared/loading";
import { OutcomeBadge } from "@/components/shared/badges";
import {
  CONTACT_ROLE_LABELS,
  FACILITY_TYPE_LABELS,
} from "@/lib/types";
import { formatDateTime } from "@/lib/datetime";
import { useFacility, useHydrated, useReport } from "@/lib/data/store";

function SuccessInner() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const id = params.get("id") ?? undefined;
  const report = useReport(id);
  const facility = useFacility(report?.facilityId);

  if (!hydrated) return <PageLoading />;

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-emerald-100 p-3 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="text-xl font-semibold">Report submitted</h1>
        <p className="text-sm text-muted-foreground">
          Your field report has been recorded and is now visible to the admin team.
        </p>
      </div>

      {report ? (
        <Card className="text-left">
          <CardContent className="space-y-2 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Facility</span>
              <span className="font-medium">{facility?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{FACILITY_TYPE_LABELS[report.facilityTypeSnapshot]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span>
                {report.contactName} — {CONTACT_ROLE_LABELS[report.contactRole]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{report.contactPhone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Outcome</span>
              <OutcomeBadge outcome={report.outcome} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span>{formatDateTime(report.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="text-right">
                {report.location.address ?? "Captured"}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Report saved.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/reports/new">
            <ClipboardPlus className="h-4 w-4" />
            Submit another
          </Link>
        </Button>
        {report ? (
          <Button asChild variant="outline">
            <Link href={`/reports/${report.id}`}>View report</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ReportSuccessPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SuccessInner />
    </Suspense>
  );
}
