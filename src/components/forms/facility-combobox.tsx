"use client";

import { useMemo, useState } from "react";
import { Building2, Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CONTACT_ROLE_OPTIONS,
  FACILITY_TYPE_LABELS,
  type ContactRole,
  type Facility,
  type FacilityType,
} from "@/lib/types";
import { useDataStore } from "@/lib/data/store";
import { ApiError } from "@/lib/api/client";

interface FacilityComboboxProps {
  facilities: Facility[];
  facilityType: FacilityType;
  value: string | null;
  onChange: (facilityId: string) => void;
}

export function FacilityCombobox({
  facilities,
  facilityType,
  value,
  onChange,
}: FacilityComboboxProps) {
  const { addFacility } = useDataStore();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // new-facility form state
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState<ContactRole | "">("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities
      .filter((f) => f.type === facilityType)
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [facilities, facilityType, query]);

  const selected = facilities.find((f) => f.id === value) ?? null;

  function startAdding() {
    setNewName(query.trim());
    setAdding(true);
  }

  // The API stamps the creating marketer from the token, so no id is sent here.
  async function confirmAdd() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    setAddError(null);
    try {
      const facility = await addFacility({
        name: newName,
        type: facilityType,
        address: newAddress || undefined,
        contactPersonName: newContactName || undefined,
        contactPersonRole: newContactRole || undefined,
        contactPhone: newContactPhone || undefined,
      });
      onChange(facility.id);
      setAdding(false);
      setQuery("");
      setNewAddress("");
      setNewContactName("");
      setNewContactRole("");
      setNewContactPhone("");
    } catch (e) {
      setAddError(
        e instanceof ApiError ? e.displayMessage : "Couldn't add the facility. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="text-xs text-muted-foreground">
              {FACILITY_TYPE_LABELS[selected.type]}
              {selected.address ? ` · ${selected.address}` : ""}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  if (adding) {
    return (
      <div className="space-y-3 rounded-md border border-border p-3">
        <p className="text-sm font-medium">
          New {FACILITY_TYPE_LABELS[facilityType].toLowerCase()}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="new-facility-name">Facility name</Label>
          <Input
            id="new-facility-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Unity Pharmacy, Ojota"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-facility-address">Address (optional)</Label>
          <Input
            id="new-facility-address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Street, area, city"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-facility-contact">Person in charge (optional)</Label>
            <Input
              id="new-facility-contact"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Their role (optional)</Label>
            <Select
              value={newContactRole}
              onValueChange={(v) => setNewContactRole(v as ContactRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-facility-phone">Contact phone (optional)</Label>
          <Input
            id="new-facility-phone"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            placeholder="+234 ..."
          />
        </div>
        {addError ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {addError}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void confirmAdd()}
            disabled={!newName.trim() || saving}
          >
            <Check className="h-4 w-4" />
            {saving ? "Adding…" : "Add & select"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => setAdding(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${FACILITY_TYPE_LABELS[facilityType].toLowerCase()} facilities`}
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {matches.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            No matching facilities.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {matches.map((facility) => (
              <li key={facility.id}>
                <button
                  type="button"
                  onClick={() => onChange(facility.id)}
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{facility.name}</span>
                  {facility.address ? (
                    <span className="text-xs text-muted-foreground">
                      {facility.address}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={startAdding}>
        <Plus className="h-4 w-4" />
        Add new facility
      </Button>
    </div>
  );
}
