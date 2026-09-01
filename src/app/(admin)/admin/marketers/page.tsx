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
import { PageHeader } from "@/components/shared/page-header";
import { TableLoading } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/badges";
import { formatRelative } from "@/lib/datetime";
import { marketerRows } from "@/lib/reporting";
import { useHydrated, useMarketers, useReports } from "@/lib/mock/store";

export default function AdminMarketersPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const marketers = useMarketers();
  const reports = useReports();

  const rows = hydrated ? marketerRows(reports, marketers) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketers"
        description={hydrated ? `${marketers.length} marketer(s)` : undefined}
      />

      {!hydrated ? (
        <TableLoading />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marketer</TableHead>
                <TableHead>Reports today</TableHead>
                <TableHead>Visits this week</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ marketer, reportsToday, visitsThisWeek, lastActivityAt }) => (
                <TableRow
                  key={marketer.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/marketers/${marketer.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{marketer.name}</div>
                    <div className="text-xs text-muted-foreground">{marketer.email}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{reportsToday}</TableCell>
                  <TableCell className="tabular-nums">{visitsThisWeek}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lastActivityAt ? formatRelative(lastActivityAt) : "No activity"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={marketer.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
