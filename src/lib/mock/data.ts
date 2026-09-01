/**
 * Mock seed data for the frontend-only build.
 *
 * `buildSeed()` returns a fresh dataset. The mock store seeds itself with this
 * once, then persists to localStorage so submitted reports survive reloads.
 * Replace this whole module with real API/Prisma reads when the backend lands.
 */

import type {
  ContactRole,
  Facility,
  FacilityType,
  Marketer,
  Outcome,
  Report,
} from "@/lib/types";

export interface MockDataset {
  marketers: Marketer[];
  facilities: Facility[];
  reports: Report[];
}

/* ------------------------------- small PRNG ------------------------------- */
/* Deterministic so the generated report history looks the same each build. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rng = makeRng(20260901);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const chance = (p: number) => rng() < p;

/* --------------------------------- people -------------------------------- */

export const MOCK_MARKETERS: Marketer[] = [
  {
    id: "mkt_jane",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+234 803 000 0001",
    status: "ACTIVE",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "mkt_john",
    name: "John Adeyemi",
    email: "john.adeyemi@example.com",
    phone: "+234 803 000 0002",
    status: "ACTIVE",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "mkt_sarah",
    name: "Sarah Okonkwo",
    email: "sarah.okonkwo@example.com",
    phone: "+234 803 000 0003",
    status: "ACTIVE",
    createdAt: "2026-02-03T09:00:00.000Z",
  },
  {
    id: "mkt_musa",
    name: "Musa Ibrahim",
    email: "musa.ibrahim@example.com",
    phone: "+234 803 000 0004",
    status: "ACTIVE",
    createdAt: "2026-03-18T09:00:00.000Z",
  },
  {
    id: "mkt_grace",
    name: "Grace Effiong",
    email: "grace.effiong@example.com",
    phone: "+234 803 000 0005",
    status: "ACTIVE",
    createdAt: "2026-05-06T09:00:00.000Z",
  },
  {
    id: "mkt_tunde",
    name: "Tunde Bakare",
    email: "tunde.bakare@example.com",
    phone: "+234 803 000 0006",
    status: "INACTIVE",
    createdAt: "2026-04-01T09:00:00.000Z",
  },
];

export const MOCK_ADMIN = {
  id: "adm_lead",
  name: "Amaka Nwosu",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

/* ------------------------------- facilities ----------------------------- */

interface FacilitySeed {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  latitude: number;
  longitude: number;
  contactPersonName: string;
  contactPersonRole: ContactRole;
  contactPhone: string;
  createdById: string;
  createdAt: string;
}

export const MOCK_FACILITIES: Facility[] = (
  [
    {
      id: "fac_abc_pharmacy",
      name: "ABC Pharmacy",
      type: "PHARMACY",
      address: "14 Adeola Odeku St, Victoria Island, Lagos",
      latitude: 6.4281,
      longitude: 3.4219,
      contactPersonName: "Chidi Okafor",
      contactPersonRole: "PHARMACIST",
      contactPhone: "+234 809 111 0001",
      createdById: "mkt_jane",
      createdAt: "2026-02-10T10:15:00.000Z",
    },
    {
      id: "fac_healthplus_ikeja",
      name: "HealthPlus Pharmacy, Ikeja",
      type: "PHARMACY",
      address: "Alade Market Rd, Allen, Ikeja, Lagos",
      latitude: 6.6018,
      longitude: 3.3515,
      contactPersonName: "Bola Aliu",
      contactPersonRole: "PHARMACIST",
      contactPhone: "+234 809 111 0002",
      createdById: "mkt_john",
      createdAt: "2026-02-14T11:30:00.000Z",
    },
    {
      id: "fac_medplus_surulere",
      name: "MedPlus Pharmacy, Surulere",
      type: "PHARMACY",
      address: "Adeniran Ogunsanya St, Surulere, Lagos",
      latitude: 6.4969,
      longitude: 3.3543,
      contactPersonName: "Ngozi Eze",
      contactPersonRole: "FACILITY_MANAGER",
      contactPhone: "+234 809 111 0003",
      createdById: "mkt_sarah",
      createdAt: "2026-03-01T09:45:00.000Z",
    },
    {
      id: "fac_greenlife_yaba",
      name: "GreenLife Pharmacy, Yaba",
      type: "PHARMACY",
      address: "Herbert Macaulay Way, Yaba, Lagos",
      latitude: 6.5095,
      longitude: 3.3711,
      contactPersonName: "Femi Balogun",
      contactPersonRole: "PHARMACIST",
      contactPhone: "+234 809 111 0004",
      createdById: "mkt_jane",
      createdAt: "2026-04-22T14:10:00.000Z",
    },
    {
      id: "fac_xyz_clinic",
      name: "XYZ Clinic",
      type: "HOSPITAL_CLINIC",
      address: "3 Kingsway Rd, Ikoyi, Lagos",
      latitude: 6.4508,
      longitude: 3.4359,
      contactPersonName: "Dr. Ade Williams",
      contactPersonRole: "DOCTOR",
      contactPhone: "+234 809 222 0001",
      createdById: "mkt_john",
      createdAt: "2026-02-18T08:50:00.000Z",
    },
    {
      id: "fac_lagoon_hospital",
      name: "Lagoon Hospital, Ikeja",
      type: "HOSPITAL_CLINIC",
      address: "8 Mobolaji Bank Anthony Way, Ikeja, Lagos",
      latitude: 6.5833,
      longitude: 3.3612,
      contactPersonName: "Dr. Halima Yusuf",
      contactPersonRole: "DOCTOR",
      contactPhone: "+234 809 222 0002",
      createdById: "mkt_musa",
      createdAt: "2026-03-09T10:05:00.000Z",
    },
    {
      id: "fac_stnicholas",
      name: "St. Nicholas Hospital",
      type: "HOSPITAL_CLINIC",
      address: "57 Campbell St, Lagos Island, Lagos",
      latitude: 6.4541,
      longitude: 3.3947,
      contactPersonName: "Dr. Emeka Obi",
      contactPersonRole: "DOCTOR",
      contactPhone: "+234 809 222 0003",
      createdById: "mkt_sarah",
      createdAt: "2026-05-19T13:20:00.000Z",
    },
    {
      id: "fac_reddington",
      name: "Reddington Hospital, VI",
      type: "HOSPITAL_CLINIC",
      address: "12 Idowu Martins St, Victoria Island, Lagos",
      latitude: 6.4293,
      longitude: 3.4227,
      contactPersonName: "Ifeoma Nnaji",
      contactPersonRole: "FACILITY_MANAGER",
      contactPhone: "+234 809 222 0004",
      createdById: "mkt_grace",
      createdAt: "2026-06-24T09:15:00.000Z",
    },
    {
      id: "fac_pathcare_lab",
      name: "PathCare Laboratory",
      type: "LABORATORY",
      address: "5 Idejo St, Victoria Island, Lagos",
      latitude: 6.4321,
      longitude: 3.4198,
      contactPersonName: "Tola Adebayo",
      contactPersonRole: "LAB_TECHNICIAN",
      contactPhone: "+234 809 333 0001",
      createdById: "mkt_jane",
      createdAt: "2026-02-27T11:00:00.000Z",
    },
    {
      id: "fac_synlab_ikeja",
      name: "SYNLAB, Ikeja",
      type: "LABORATORY",
      address: "24 Oba Akran Ave, Ikeja, Lagos",
      latitude: 6.6155,
      longitude: 3.3417,
      contactPersonName: "Kunle Ojo",
      contactPersonRole: "LAB_TECHNICIAN",
      contactPhone: "+234 809 333 0002",
      createdById: "mkt_musa",
      createdAt: "2026-03-30T15:40:00.000Z",
    },
    {
      id: "fac_afriglobal",
      name: "Afriglobal Medicare",
      type: "LABORATORY",
      address: "34 Adeniyi Jones Ave, Ikeja, Lagos",
      latitude: 6.6009,
      longitude: 3.3489,
      contactPersonName: "Rita Uche",
      contactPersonRole: "LAB_TECHNICIAN",
      contactPhone: "+234 809 333 0003",
      createdById: "mkt_grace",
      createdAt: "2026-07-11T10:25:00.000Z",
    },
    {
      id: "fac_clina_lancet",
      name: "Clina-Lancet Laboratories",
      type: "LABORATORY",
      address: "1 Fatai Durosinmi Etti Dr, Lekki Phase 1, Lagos",
      latitude: 6.4415,
      longitude: 3.4736,
      contactPersonName: "Segun Alabi",
      contactPersonRole: "FACILITY_MANAGER",
      contactPhone: "+234 809 333 0004",
      createdById: "mkt_john",
      createdAt: "2026-08-02T12:00:00.000Z",
    },
    {
      id: "fac_bluecross_lekki",
      name: "BlueCross Pharmacy, Lekki",
      type: "PHARMACY",
      address: "Admiralty Way, Lekki Phase 1, Lagos",
      latitude: 6.4444,
      longitude: 3.4712,
      contactPersonName: "Peace Ekong",
      contactPersonRole: "PHARMACIST",
      contactPhone: "+234 809 111 0005",
      createdById: "mkt_grace",
      createdAt: "2026-08-20T09:30:00.000Z",
    },
    {
      id: "fac_first_clinic_ajah",
      name: "First Clinic, Ajah",
      type: "HOSPITAL_CLINIC",
      address: "Addo Rd, Ajah, Lagos",
      latitude: 6.4667,
      longitude: 3.5679,
      contactPersonName: "Dr. Bisi Cole",
      contactPersonRole: "DOCTOR",
      contactPhone: "+234 809 222 0005",
      createdById: "mkt_sarah",
      createdAt: "2026-08-25T14:45:00.000Z",
    },
  ] satisfies FacilitySeed[]
).map((f) => ({ ...f }));

/* -------------------------------- reports ------------------------------- */

const CONTACT_NAMES = [
  "John Smith",
  "Dr. Ade",
  "Mrs. Adeyinka",
  "Chinelo Okoro",
  "Ahmed Bello",
  "Dr. Ngozi Umeh",
  "Kemi Balogun",
  "Mr. Danjuma",
  "Blessing Obi",
  "Dr. Sola Martins",
  "Uche Nwankwo",
  "Fatima Sani",
];

const REMARKS_BY_OUTCOME: Record<Outcome, string[]> = {
  INTERESTED: [
    "Walked the pharmacist through the product range. They asked for a price list and samples before committing.",
    "Positive reception. Wants to discuss with the owner next week before placing an order.",
    "Interested in stocking the starter pack. Will confirm quantities after checking current stock levels.",
  ],
  FOLLOW_UP_REQUIRED: [
    "Decision maker was in a meeting. Front desk asked me to return with a formal proposal.",
    "Needs approval from the procurement lead. Agreed I would come back with the paperwork.",
    "Reviewing a competing supplier. Asked for a follow-up visit once their contract is up.",
  ],
  CONVERTED: [
    "Placed a first order for two cartons. Delivery details captured, invoice to follow.",
    "Signed the supply agreement on the spot. Onboarding pack handed over.",
    "Converted after the second visit — committed to a monthly standing order.",
  ],
  NOT_INTERESTED: [
    "Already locked into an exclusive supplier for the next 12 months. No room to switch.",
    "Said the margins do not work for their location. Not pursuing further this quarter.",
    "Not a fit — they only stock a narrow formulary set by head office.",
  ],
  NO_DECISION_MAKER: [
    "Owner travelled. Staff could not speak to purchasing. Left a brochure and my card.",
    "Facility manager unavailable. Receptionist took my details for a callback.",
    "Arrived during shift change — no one authorised to talk procurement.",
  ],
  OTHER: [
    "Facility was closed for renovations. Noted to re-route next week.",
    "Brief courtesy visit to keep the relationship warm. No specific ask this time.",
  ],
};

const OUTCOME_POOL: Outcome[] = [
  "INTERESTED",
  "INTERESTED",
  "FOLLOW_UP_REQUIRED",
  "FOLLOW_UP_REQUIRED",
  "CONVERTED",
  "NOT_INTERESTED",
  "NO_DECISION_MAKER",
  "OTHER",
];

const CONTACT_ROLE_BY_FACILITY: Record<FacilityType, ContactRole[]> = {
  PHARMACY: ["PHARMACIST", "FACILITY_MANAGER", "OTHER"],
  HOSPITAL_CLINIC: ["DOCTOR", "FACILITY_MANAGER", "OTHER"],
  LABORATORY: ["LAB_TECHNICIAN", "FACILITY_MANAGER", "OTHER"],
};

const MOCK_ADDRESS_SUFFIX = "Lagos, Nigeria";

function jitter(base: number, meters: number): number {
  // ~1 degree lat ≈ 111_000 m; good enough for a mock pin near the facility.
  const deg = meters / 111_000;
  return base + (rng() * 2 - 1) * deg;
}

function buildReports(marketers: Marketer[], facilities: Facility[]): Report[] {
  const activeMarketers = marketers.filter((m) => m.status === "ACTIVE");
  const reports: Report[] = [];
  let counter = 0;

  // Spread visits across the last 24 days, weighted toward recent days.
  for (let dayOffset = 24; dayOffset >= 0; dayOffset--) {
    const isRecent = dayOffset <= 6;
    const isToday = dayOffset === 0;
    // Weekends lighter.
    const dow = (new Date(Date.now() - dayOffset * 86_400_000).getUTCDay() + 6) % 7;
    const isWeekend = dow >= 5;

    for (const marketer of activeMarketers) {
      let visits = isWeekend ? (chance(0.3) ? 1 : 0) : isRecent ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
      if (isToday) visits = marketer.id === "mkt_jane" ? 3 : 1 + Math.floor(rng() * 2);
      if (marketer.id === "mkt_grace" && dayOffset > 10) visits = chance(0.5) ? 1 : 0;

      const usedFacilityIds = new Set<string>();
      for (let v = 0; v < visits; v++) {
        let facility = pick(facilities);
        let guard = 0;
        while (usedFacilityIds.has(facility.id) && guard++ < 5) facility = pick(facilities);
        usedFacilityIds.add(facility.id);

        const hour = 8 + v * 2 + Math.floor(rng() * 2); // 8am onward
        const minute = Math.floor(rng() * 60);
        const created = new Date(Date.now() - dayOffset * 86_400_000);
        created.setHours(hour, minute, 0, 0);

        const outcome = pick(OUTCOME_POOL);
        const followUpRequired = outcome === "FOLLOW_UP_REQUIRED";
        const followUpDate = followUpRequired
          ? new Date(created.getTime() + (2 + Math.floor(rng() * 6)) * 86_400_000)
              .toISOString()
              .slice(0, 10)
          : undefined;
        const followUpCompletedAt =
          followUpRequired && dayOffset > 8 && chance(0.4)
            ? new Date(created.getTime() + 3 * 86_400_000).toISOString()
            : undefined;

        const contactRole = pick(CONTACT_ROLE_BY_FACILITY[facility.type]);

        reports.push({
          id: `rep_${String(++counter).padStart(4, "0")}`,
          marketerId: marketer.id,
          facilityId: facility.id,
          facilityTypeSnapshot: facility.type,
          contactName: pick(CONTACT_NAMES),
          contactRole,
          outcome,
          followUpRequired,
          followUpDate,
          followUpCompletedAt,
          remarks: pick(REMARKS_BY_OUTCOME[outcome]),
          location: {
            latitude: Number(jitter(facility.latitude ?? 6.45, 120).toFixed(6)),
            longitude: Number(jitter(facility.longitude ?? 3.4, 120).toFixed(6)),
            accuracy: 8 + Math.floor(rng() * 40),
            capturedAt: created.toISOString(),
            address: facility.address
              ? facility.address
              : `Near ${facility.name}, ${MOCK_ADDRESS_SUFFIX}`,
          },
          locationStatus: "CAPTURED",
          createdAt: created.toISOString(),
        });
      }
    }
  }

  return reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildSeed(): MockDataset {
  const marketers = MOCK_MARKETERS.map((m) => ({ ...m }));
  const facilities = MOCK_FACILITIES.map((f) => ({ ...f }));
  const reports = buildReports(marketers, facilities);
  return { marketers, facilities, reports };
}
