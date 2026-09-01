/**
 * Reverse geocoding — MOCK implementation.
 *
 * The real version (Phase 8) will POST to a server route that calls the Google
 * Geocoding API with a secret key. Keep the signature stable so only the body of
 * `getAddressForCoords` changes.
 */

const LAGOS_AREAS = [
  "Victoria Island",
  "Ikoyi",
  "Lekki Phase 1",
  "Ikeja GRA",
  "Yaba",
  "Surulere",
  "Lagos Island",
  "Ajah",
  "Maryland",
  "Gbagada",
];

const STREETS = [
  "Adeola Odeku St",
  "Kingsway Rd",
  "Admiralty Way",
  "Herbert Macaulay Way",
  "Oba Akran Ave",
  "Awolowo Rd",
  "Bourdillon Rd",
  "Allen Ave",
];

export interface ReverseGeocodeResult {
  address: string;
}

/** Simulates a network round-trip and returns a plausible Lagos address. */
export async function getAddressForCoords(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  await new Promise((r) => setTimeout(r, 700));
  // Deterministic-ish from the coordinates so retries are stable.
  const seed = Math.abs(Math.round((latitude + longitude) * 1_000_000));
  const number = (seed % 90) + 1;
  const street = STREETS[seed % STREETS.length];
  const area = LAGOS_AREAS[Math.floor(seed / 7) % LAGOS_AREAS.length];
  return { address: `${number} ${street}, ${area}, Lagos, Nigeria` };
}

/** Link to an external map for a set of coordinates (no embedded SDK in MVP). */
export function mapLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
