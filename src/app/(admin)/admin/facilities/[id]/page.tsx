"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { BreakdownList } from "@/components/shared/breakdown-list";
import {
  FacilityTypeBadge,
  OutcomeBadge,
  ContactRoleBadge,
} from "@/components/shared/badges";
import { CONTACT_ROLE_LABELS, OUTCOME_LABELS } from "@/lib/types";
import { byNewest, formatDate, formatDateTime } from "@/lib/datetime";
import { summariseReports } from "@/lib/reporting";
import { mapLink } from "@/lib/geocoding";
import {
  useFacility,
  useHydrated,
  useMarketers,
  useReports,
} from "@/lib/data/store";

function FacilityDetailInner({ id }: { id: string }) {
  const hydrated = useHydrated();
  const facility = useFacility(id);
  const reports = useReports();
  const marketers = useMarketers();

  if (!hydrated) return <PageLoading />;

  if (!facility) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/facilities">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <EmptyState icon={Building2} title="Facility not found" />
      </div>
    );
  }

  const marketerById = new Map(marketers.map((m) => [m.id, m]));
  const visits = reports.filter((r) => r.facilityId === id).sort(byNewest);
  const summary = summariseReports(visits);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/facilities">
          <ArrowLeft className="h-4 w-4" />
          Back to facilities
        </Link>
      </Button>

      <PageHeader
        title={facility.name}
        description={`Added ${formatDate(facility.createdAt)}`}
        actions={<FacilityTypeBadge type={facility.type} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p>{facility.address ?? "No address on file"}</p>
                {facility.latitude != null && facility.longitude != null ? (
                  <a
                    href={mapLink(facility.latitude, facility.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View on map
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {facility.contactPersonName ?? "No contact on file"}
                {facility.contactPersonRole
                  ? ` — ${CONTACT_ROLE_LABELS[facility.contactPersonRole]}`
                  : ""}
              </span>
            </div>
            {facility.contactPhone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{facility.contactPhone}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Stat label="Total visits" value={summary.totalVisits} />
            <Stat
              label="Last visit"
              value={visits[0] ? formatDate(visits[0].createdAt) : "Never"}
            />
            <Stat label="Follow-ups logged" value={summary.followUpsCreated} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              items={summary.outcomeBreakdown.map((b) => ({
                label: OUTCOME_LABELS[b.outcome],
                count: b.count,
              }))}
              total={summary.totalReports}
              emptyLabel="No visits yet."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit history ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <EmptyState title="No visits recorded" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Marketer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell>{marketerById.get(r.marketerId)?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div>{r.contactName}</div>
                      <div className="mt-0.5">
                        <ContactRoleBadge role={r.contactRole} />
                      </div>
                      {r.contactPhone ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {r.contactPhone}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={r.outcome} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default function AdminFacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FacilityDetailInner id={id} />;
}
