"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTACT_ROLE_LABELS,
  FACILITY_TYPE_LABELS,
  type Facility,
  type Marketer,
  type Report,
} from "@/lib/types";
import { formatDate, formatTime } from "@/lib/datetime";
import { OutcomeBadge, FollowUpBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";

interface ReportsTableProps {
  reports: Report[];
  facilities: Facility[];
  marketers: Marketer[];
  hrefBase: string;
  showMarketer?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ReportsTable({
  reports,
  facilities,
  marketers,
  hrefBase,
  showMarketer = false,
  emptyTitle = "No reports found",
  emptyDescription = "Try adjusting your filters.",
}: ReportsTableProps) {
  const router = useRouter();
  const facilityById = new Map(facilities.map((f) => [f.id, f]));
  const marketerById = new Map(marketers.map((m) => [m.id, m]));

  if (reports.length === 0) {
    return (
      <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showMarketer ? <TableHead>Marketer</TableHead> : null}
            <TableHead>Facility</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Follow-up</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const facility = facilityById.get(report.facilityId);
            const marketer = marketerById.get(report.marketerId);
            return (
              <TableRow
                key={report.id}
                className="cursor-pointer"
                onClick={() => router.push(`${hrefBase}/${report.id}`)}
              >
                <TableCell className="whitespace-nowrap">
                  <div className="font-medium">{formatDate(report.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(report.createdAt)}
                  </div>
                </TableCell>
                {showMarketer ? (
                  <TableCell className="whitespace-nowrap">
                    {marketer?.name ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell className="min-w-[160px] font-medium">
                  {facility?.name ?? "Unknown facility"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {FACILITY_TYPE_LABELS[report.facilityTypeSnapshot]}
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <div>{report.contactName}</div>
                  <div className="text-xs text-muted-foreground">
                    {CONTACT_ROLE_LABELS[report.contactRole]}
                  </div>
                </TableCell>
                <TableCell>
                  <OutcomeBadge outcome={report.outcome} />
                </TableCell>
                <TableCell>
                  <FollowUpBadge report={report} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
