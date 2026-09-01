"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/badges";
import { DailyActivityView } from "@/components/admin/daily-activity-view";
import { cn } from "@/lib/utils";
import { formatDate, todayYMD } from "@/lib/datetime";
import { activeDatesForMarketer } from "@/lib/reporting";
import { useHydrated, useMarketer, useReports } from "@/lib/mock/store";

function MarketerActivityInner({ id }: { id: string }) {
  const hydrated = useHydrated();
  const marketer = useMarketer(id);
  const reports = useReports();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!hydrated) return <PageLoading />;

  if (!marketer) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/marketers">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <EmptyState title="Marketer not found" />
      </div>
    );
  }

  const date = searchParams.get("date") || todayYMD();
  const recentDates = activeDatesForMarketer(reports, id).slice(0, 6);

  function setDate(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/marketers">
          <ArrowLeft className="h-4 w-4" />
          Back to marketers
        </Link>
      </Button>

      <PageHeader
        title={marketer.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {marketer.email}
            </span>
            {marketer.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {marketer.phone}
              </span>
            ) : null}
          </span>
        }
        actions={<StatusBadge status={marketer.status} />}
      />

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="activity-date">Activity for</Label>
            <Input
              id="activity-date"
              type="date"
              value={date}
              max={todayYMD()}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(todayYMD())}>
            Today
          </Button>
        </div>
        {recentDates.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {recentDates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  d === date
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {formatDate(`${d}T12:00:00Z`)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <DailyActivityView marketerId={id} date={date} />
    </div>
  );
}

export default function AdminMarketerActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<PageLoading />}>
      <MarketerActivityInner id={id} />
    </Suspense>
  );
}
