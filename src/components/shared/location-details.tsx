import { ExternalLink, MapPin } from "lucide-react";
import type { GeoLocation } from "@/lib/types";
import { formatDateTime } from "@/lib/datetime";
import { mapLink } from "@/lib/geocoding";

export function LocationDetails({ location }: { location: GeoLocation }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{location.address ?? "Address unavailable"}</p>
          <p className="text-muted-foreground">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} · ±
            {Math.round(location.accuracy)} m
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Captured at</dt>
          <dd>{formatDateTime(location.capturedAt)}</dd>
        </div>
      </dl>
      <a
        href={mapLink(location.latitude, location.longitude)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        View on map <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
