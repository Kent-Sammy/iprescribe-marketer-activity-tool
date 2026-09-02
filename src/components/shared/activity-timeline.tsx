import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Facility, Report } from "@/lib/types";
import { CONTACT_ROLE_LABELS } from "@/lib/types";
import { formatDateLong, formatTime } from "@/lib/datetime";
import { groupByDay } from "@/lib/reporting";
import { OutcomeBadge, FollowUpBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";

interface ActivityTimelineProps {
  reports: Report[];
  facilities: Facility[];
  /** e.g. "/reports" (marketer) or "/admin/reports" (admin) */
  hrefBase: string;
  groupByDate?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ActivityTimeline({
  reports,
  facilities,
  hrefBase,
  groupByDate = false,
  emptyTitle = "No activity yet",
  emptyDescription,
}: ActivityTimelineProps) {
  const facilityById = new Map(facilities.map((f) => [f.id, f]));

  if (reports.length === 0) {
    return <EmptyState icon={MapPin} title={emptyTitle} description={emptyDescription} />;
  }

  const groups = groupByDate ? groupByDay(reports) : [{ ymd: "", reports }];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.ymd || "all"} className="space-y-3">
          {group.ymd ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatDateLong(group.reports[0].createdAt)}
            </p>
          ) : null}
          <ol className="relative space-y-4 border-l border-border pl-5">
            {group.reports.map((report) => {
              const facility = facilityById.get(report.facilityId);
              return (
                <li key={report.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <Link
                    href={`${hrefBase}/${report.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium tabular-nums text-muted-foreground">
                        {formatTime(report.createdAt)}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <OutcomeBadge outcome={report.outcome} />
                        {report.followUpRequired ? (
                          <FollowUpBadge report={report} />
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 font-medium">
                      {facility?.name ?? "Unknown facility"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {report.contactName} — {CONTACT_ROLE_LABELS[report.contactRole]}
                      {report.contactPhone ? ` · ${report.contactPhone}` : ""}
                    </p>
                    {report.remarks ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {report.remarks}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
