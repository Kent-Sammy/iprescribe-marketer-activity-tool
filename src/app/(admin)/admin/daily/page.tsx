"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { DailyActivityView } from "@/components/admin/daily-activity-view";
import { todayYMD } from "@/lib/datetime";
import { useHydrated, useMarketers } from "@/lib/mock/store";

function DailyInner() {
  const hydrated = useHydrated();
  const marketers = useMarketers();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!hydrated) return <PageLoading />;

  const marketerId = searchParams.get("marketerId") || marketers[0]?.id || "";
  const date = searchParams.get("date") || todayYMD();

  function update(key: "marketerId" | "date", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (!params.get("marketerId")) params.set("marketerId", marketerId);
    if (!params.get("date")) params.set("date", date);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const marketer = marketers.find((m) => m.id === marketerId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Activity"
        description="Pick a marketer and a date to see everything they did that day."
      />

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Marketer</Label>
          <Select value={marketerId} onValueChange={(v) => update("marketerId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marketers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="daily-date">Date</Label>
          <Input
            id="daily-date"
            type="date"
            value={date}
            max={todayYMD()}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>
      </div>

      {marketer ? (
        <>
          <div className="text-sm font-medium text-muted-foreground">{marketer.name}</div>
          <DailyActivityView marketerId={marketerId} date={date} />
        </>
      ) : (
        <EmptyState title="Select a marketer" />
      )}
    </div>
  );
}

export default function AdminDailyActivityPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <DailyInner />
    </Suspense>
  );
}
