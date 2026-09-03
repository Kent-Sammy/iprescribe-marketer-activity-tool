/**
 * Reverse geocoding, via the API's Google-backed endpoint.
 *
 * The Google key stays server-side — the browser only ever sends coordinates.
 * Coordinates Google can't resolve are not an error: the report still saves,
 * just without a street address, so this returns an empty address rather than
 * throwing.
 */

import { apiFetch } from "@/lib/api/client";

export interface ReverseGeocodeResult {
  address?: string;
}

interface ReverseGeocodePayload {
  address: string | null;
  place_id: string | null;
}

export async function getAddressForCoords(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  try {
    const result = await apiFetch<ReverseGeocodePayload>(
      "/v1/marketer/utils/reverse-geocode",
      { query: { latitude, longitude } },
    );
    return { address: result?.address ?? undefined };
  } catch {
    // A geocoding outage must not block a submission — location capture only
    // requires the coordinates.
    return {};
  }
}

/** Link to an external map for a set of coordinates (no embedded SDK in MVP). */
export function mapLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
