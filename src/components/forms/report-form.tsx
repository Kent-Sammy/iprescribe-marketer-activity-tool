"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FlaskConical, Hospital, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CONTACT_ROLE_LABELS,
  CONTACT_ROLE_OPTIONS,
  FACILITY_TYPE_LABELS,
  OUTCOME_OPTIONS,
  type ContactRole,
  type FacilityType,
  type GeoLocation,
  type Outcome,
} from "@/lib/types";
import { todayYMD } from "@/lib/datetime";
import { useFacilities, useDataStore } from "@/lib/data/store";
import { ApiError } from "@/lib/api/client";
import { FacilityCombobox } from "@/components/forms/facility-combobox";
import { LocationCapture } from "@/components/forms/location-capture";
import { OutcomeBadge } from "@/components/shared/badges";

const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Pill> = {
  PHARMACY: Pill,
  HOSPITAL_CLINIC: Hospital,
  LABORATORY: FlaskConical,
};

const STEPS = [
  "Facility type",
  "Facility",
  "Person contacted",
  "Location",
  "Outcome",
  "Remarks",
  "Review",
] as const;

interface FormState {
  facilityType: FacilityType | null;
  facilityId: string | null;
  contactName: string;
  contactPhone: string;
  contactRole: ContactRole | "";
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  location: GeoLocation | null;
  outcome: Outcome | "";
  followUpDate: string;
  remarks: string;
}

const INITIAL: FormState = {
  facilityType: null,
  facilityId: null,
  contactName: "",
  contactPhone: "",
  contactRole: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  location: null,
  outcome: "",
  followUpDate: "",
  remarks: "",
};

export function ReportForm() {
  const router = useRouter();
  const facilities = useFacilities();
  const { addReport } = useDataStore();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Set when the user tries to advance/submit an incomplete step. */
  const [triedNext, setTriedNext] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedFacility = facilities.find((f) => f.id === form.facilityId) ?? null;

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return form.facilityType !== null;
      case 1:
        return form.facilityId !== null;
      case 2:
        return (
          form.contactName.trim().length > 0 &&
          form.contactPhone.trim().length > 0 &&
          form.contactRole !== ""
        );
      case 3:
        return form.location !== null;
      case 4:
        return (
          form.outcome !== "" &&
          (form.outcome !== "FOLLOW_UP_REQUIRED" || form.followUpDate !== "")
        );
      case 5:
        return form.remarks.trim().length > 0;
      default:
        return true;
    }
  }, [step, form]);

  function next() {
    if (!stepValid) {
      setTriedNext(true);
      return;
    }
    setTriedNext(false);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }
  function back() {
    setTriedNext(false);
    if (step > 0) setStep((s) => s - 1);
  }

  // The marketer, the visit timestamp and the facility-type snapshot are all
  // set server-side, so none of them are sent from here.
  async function submit() {
    if (
      !form.facilityType ||
      !form.facilityId ||
      !form.location ||
      form.outcome === "" ||
      form.contactName.trim() === "" ||
      form.contactPhone.trim() === "" ||
      form.contactRole === ""
    ) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const report = await addReport({
        facilityId: form.facilityId,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactRole: form.contactRole as ContactRole,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        ownerEmail: form.ownerEmail,
        outcome: form.outcome,
        followUpDate:
          form.outcome === "FOLLOW_UP_REQUIRED" ? form.followUpDate : undefined,
        remarks: form.remarks,
        location: form.location,
      });
      router.push(`/reports/new/success?id=${report.id}`);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.displayMessage : "Couldn't submit the report. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <Card>
        <CardContent className="space-y-4 p-5">
          {/* -------- Step 0: facility type -------- */}
          {step === 0 ? (
            <div className="space-y-3">
              <Label>What kind of facility did you visit?</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map((type) => {
                  const Icon = FACILITY_TYPE_ICONS[type];
                  const active = form.facilityType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        set("facilityType", type);
                        if (form.facilityId) set("facilityId", null);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      {FACILITY_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* -------- Step 1: facility -------- */}
          {step === 1 && form.facilityType ? (
            <div className="space-y-2">
              <Label>Which facility?</Label>
              <FacilityCombobox
                facilities={facilities}
                facilityType={form.facilityType}
                value={form.facilityId}
                onChange={(id) => set("facilityId", id || null)}
              />
            </div>
          ) : null}

          {/* -------- Step 2: person contacted -------- */}
          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">
                  Person contacted <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  placeholder="Full name"
                  aria-invalid={triedNext && form.contactName.trim() === ""}
                />
                {triedNext && form.contactName.trim() === "" ? (
                  <p className="text-xs text-destructive">Name is required.</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">
                  Phone number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  placeholder="+234 ..."
                  aria-invalid={triedNext && form.contactPhone.trim() === ""}
                />
                {triedNext && form.contactPhone.trim() === "" ? (
                  <p className="text-xs text-destructive">Phone number is required.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Used to follow up with this contact after the visit.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Their role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.contactRole}
                  onValueChange={(v) => set("contactRole", v as ContactRole)}
                >
                  <SelectTrigger aria-invalid={triedNext && form.contactRole === ""}>
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
                {triedNext && form.contactRole === "" ? (
                  <p className="text-xs text-destructive">Contact role is required.</p>
                ) : null}
              </div>

              {/* Optional — the facility owner is a different contact. */}
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Facility owner (optional)</p>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">Owner name</Label>
                  <Input
                    id="owner-name"
                    value={form.ownerName}
                    onChange={(e) => set("ownerName", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-phone">Owner phone number</Label>
                  <Input
                    id="owner-phone"
                    type="tel"
                    inputMode="tel"
                    value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                    placeholder="+234 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-email">Owner email address</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    inputMode="email"
                    value={form.ownerEmail}
                    onChange={(e) => set("ownerEmail", e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* -------- Step 3: location -------- */}
          {step === 3 ? (
            <LocationCapture
              value={form.location}
              onChange={(loc) => set("location", loc)}
            />
          ) : null}

          {/* -------- Step 4: outcome -------- */}
          {step === 4 ? (
            <div className="space-y-3">
              <Label>What was the outcome?</Label>
              <div className="grid grid-cols-1 gap-2">
                {OUTCOME_OPTIONS.map((o) => {
                  const active = form.outcome === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set("outcome", o.value)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {o.label}
                      {active ? <Check className="h-4 w-4 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
              {form.outcome === "FOLLOW_UP_REQUIRED" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="follow-up-date">Follow-up date</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    min={todayYMD()}
                    value={form.followUpDate}
                    onChange={(e) => set("followUpDate", e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* -------- Step 5: remarks -------- */}
          {step === 5 ? (
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="What happened during the visit?"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Describe the conversation, any commitments, and next steps.
              </p>
            </div>
          ) : null}

          {/* -------- Step 6: review -------- */}
          {step === 6 ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Review your report</p>
              <dl className="divide-y divide-border rounded-md border border-border">
                <Row label="Facility type">
                  {form.facilityType ? FACILITY_TYPE_LABELS[form.facilityType] : "—"}
                </Row>
                <Row label="Facility">{selectedFacility?.name ?? "—"}</Row>
                <Row label="Person contacted">
                  {form.contactName} —{" "}
                  {form.contactRole ? CONTACT_ROLE_LABELS[form.contactRole] : "—"}
                </Row>
                <Row label="Phone number">{form.contactPhone || "—"}</Row>
                {form.ownerName.trim() ||
                form.ownerPhone.trim() ||
                form.ownerEmail.trim() ? (
                  <>
                    {form.ownerName.trim() ? (
                      <Row label="Facility owner">{form.ownerName}</Row>
                    ) : null}
                    {form.ownerPhone.trim() ? (
                      <Row label="Owner phone">{form.ownerPhone}</Row>
                    ) : null}
                    {form.ownerEmail.trim() ? (
                      <Row label="Owner email">{form.ownerEmail}</Row>
                    ) : null}
                  </>
                ) : null}
                <Row label="Location">
                  {form.location
                    ? `${form.location.address ?? "Captured"} (±${form.location.accuracy} m)`
                    : "—"}
                </Row>
                <Row label="Outcome">
                  {form.outcome ? <OutcomeBadge outcome={form.outcome} /> : "—"}
                </Row>
                {form.outcome === "FOLLOW_UP_REQUIRED" ? (
                  <Row label="Follow-up date">{form.followUpDate || "—"}</Row>
                ) : null}
                <Row label="Remarks">{form.remarks || "—"}</Row>
              </dl>
              <p className="text-xs text-muted-foreground">
                Your name, the date and the time are added automatically and
                can’t be edited after you submit.
              </p>
            </div>
          ) : null}

          {/* -------- nav -------- */}
          {triedNext && !stepValid && step !== 2 ? (
            <p className="text-xs text-destructive">
              Please complete the required fields to continue.
            </p>
          ) : null}
          {submitError ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </p>
          ) : null}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0 || submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} disabled={submitting}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || !stepValid}
              >
                <Check className="h-4 w-4" />
                {submitting ? "Submitting…" : "Submit report"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
