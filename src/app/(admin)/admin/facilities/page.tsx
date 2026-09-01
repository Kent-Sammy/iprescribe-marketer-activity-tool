"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FacilityTypeBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { FACILITY_TYPE_OPTIONS, type FacilityType } from "@/lib/types";
import { byNewest, formatDate } from "@/lib/datetime";
import { useFacilities, useHydrated, useReports } from "@/lib/mock/store";

const ALL = "ALL";

export default function AdminFacilitiesPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const facilities = useFacilities();
  const reports = useReports();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<FacilityType | typeof ALL>(ALL);

  const rows = useMemo(() => {
    const statsByFacility = new Map<string, { visits: number; lastVisit?: string }>();
    for (const r of [...reports].sort(byNewest)) {
      const cur = statsByFacility.get(r.facilityId) ?? { visits: 0 };
      cur.visits += 1;
      cur.lastVisit = cur.lastVisit ?? r.createdAt;
      statsByFacility.set(r.facilityId, cur);
    }
    const q = query.trim().toLowerCase();
    return facilities
      .filter((f) => (type === ALL ? true : f.type === type))
      .filter((f) =>
        q
          ? f.name.toLowerCase().includes(q) ||
            (f.address ?? "").toLowerCase().includes(q)
          : true,
      )
      .map((f) => ({
        facility: f,
        ...(statsByFacility.get(f.id) ?? { visits: 0, lastVisit: undefined }),
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [facilities, reports, query, type]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description={hydrated ? `${facilities.length} facilities` : undefined}
      />

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="facility-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="facility-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or address"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as FacilityType | typeof ALL)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {FACILITY_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hydrated ? (
        <TableLoading />
      ) : rows.length === 0 ? (
        <EmptyState title="No facilities match" />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ facility, visits, lastVisit }) => (
                <TableRow
                  key={facility.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/facilities/${facility.id}`)}
                >
                  <TableCell className="font-medium">{facility.name}</TableCell>
                  <TableCell>
                    <FacilityTypeBadge type={facility.type} />
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {facility.address ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">{visits}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lastVisit ? formatDate(lastVisit) : "Never"}
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
