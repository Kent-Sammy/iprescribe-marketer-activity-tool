"use client";

import { useState } from "react";
import { AlertTriangle, Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GeoLocation } from "@/lib/types";
import { formatTime } from "@/lib/datetime";
import { getAddressForCoords, mapLink } from "@/lib/geocoding";

type CaptureState = "idle" | "capturing" | "captured" | "error";

const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

interface LocationCaptureProps {
  value: GeoLocation | null;
  onChange: (location: GeoLocation | null) => void;
}

/**
 * MOCK location capture.
 *
 * The real component (Phase 3/8) will call navigator.geolocation.getCurrentPosition
 * and POST the coords to /api/geocode. The prop contract (value / onChange) and
 * the "must succeed before submit" behaviour stay the same.
 */
export function LocationCapture({ value, onChange }: LocationCaptureProps) {
  const [state, setState] = useState<CaptureState>(value ? "captured" : "idle");
  const [simulateDenied, setSimulateDenied] = useState(false);

  async function capture() {
    setState("capturing");
    onChange(null);
    await new Promise((r) => setTimeout(r, 1400));

    if (simulateDenied) {
      setState("error");
      return;
    }

    const latitude = Number((LAGOS_CENTER.lat + (Math.random() * 2 - 1) * 0.02).toFixed(6));
    const longitude = Number((LAGOS_CENTER.lng + (Math.random() * 2 - 1) * 0.02).toFixed(6));
    const accuracy = Math.round(6 + Math.random() * 24);
    const capturedAt = new Date().toISOString();

    let address: string | undefined;
    try {
      address = (await getAddressForCoords(latitude, longitude)).address;
    } catch {
      address = undefined;
    }

    onChange({ latitude, longitude, accuracy, capturedAt, address });
    setState("captured");
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          Current location
          <span className="text-destructive">*</span>
        </Label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={simulateDenied}
            onChange={(e) => setSimulateDenied(e.target.checked)}
          />
          Simulate “permission denied”
        </label>
      </div>

      {state === "idle" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            A report can’t be submitted without a captured location.
          </p>
          <Button type="button" onClick={capture}>
            <Crosshair className="h-4 w-4" />
            Capture location
          </Button>
        </div>
      ) : null}

      {state === "capturing" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Getting your location…
        </div>
      ) : null}

      {state === "error" ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Location permission denied or unavailable. Enable location access
              and try again — the report cannot be submitted without it.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={capture}>
            <Crosshair className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {state === "captured" && value ? (
        <div className="space-y-2">
          <div className="rounded-md bg-emerald-50 p-2.5 text-sm">
            <p className="font-medium text-emerald-900">Location captured</p>
            <p className="text-emerald-800">
              {value.address ?? "Address unavailable"}
            </p>
            <p className="text-xs text-emerald-700">
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)} · ±
              {value.accuracy} m · {formatTime(value.capturedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={capture}>
              <Crosshair className="h-4 w-4" />
              Recapture
            </Button>
            <a
              href={mapLink(value.latitude, value.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              View on map
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
