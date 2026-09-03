"use client";

import { useState } from "react";
import { AlertTriangle, Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GeoLocation } from "@/lib/types";
import { formatTime } from "@/lib/datetime";
import { getAddressForCoords, mapLink } from "@/lib/geocoding";

type CaptureState = "idle" | "capturing" | "captured" | "error";

/** Wait this long for a fix before giving up and offering a retry. */
const GEOLOCATION_TIMEOUT_MS = 15_000;

interface LocationCaptureProps {
  value: GeoLocation | null;
  onChange: (location: GeoLocation | null) => void;
}

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This device can't report its location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 0,
    });
  });
}

function messageFor(error: unknown): string {
  if (typeof GeolocationPositionError !== "undefined" && error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission was denied. Enable location access for this site and try again — the report cannot be submitted without it.";
      case error.POSITION_UNAVAILABLE:
        return "Your location couldn't be determined. Move somewhere with a clearer signal and try again.";
      case error.TIMEOUT:
        return "Getting your location took too long. Try again.";
    }
  }
  return error instanceof Error
    ? error.message
    : "Your location couldn't be captured. Try again.";
}

/**
 * Captures the marketer's GPS position for a report.
 *
 * Location is mandatory: submission is blocked until this succeeds, and a
 * denied or failed reading is a retry, never a save. The reverse-geocoded
 * address is best-effort — a geocoding outage leaves the address blank but
 * still yields a usable capture.
 */
export function LocationCapture({ value, onChange }: LocationCaptureProps) {
  const [state, setState] = useState<CaptureState>(value ? "captured" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    setState("capturing");
    setError(null);
    onChange(null);

    let position: GeolocationPosition;
    try {
      position = await readPosition();
    } catch (e) {
      setError(messageFor(e));
      setState("error");
      return;
    }

    const { latitude, longitude, accuracy } = position.coords;
    const { address } = await getAddressForCoords(latitude, longitude);

    onChange({
      latitude,
      longitude,
      accuracy: Math.round(accuracy),
      capturedAt: new Date(position.timestamp).toISOString(),
      address,
    });
    setState("captured");
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <Label className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4" />
        Current location
        <span className="text-destructive">*</span>
      </Label>

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
            <p>{error}</p>
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
