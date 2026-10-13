import type { Venue } from "../../core/entities/Venue";
import type { ScalarInput } from "../../core/types/DomainScalars";

const DEFAULT_VENUES_SEEDS: Omit<
  ScalarInput<Venue>,
  "created_at" | "updated_at"
>[] = [
  {
    id: "venue_default_1",
    organization_id: "org_default_1",
    name: "Lugogo Hockey Stadium",
    short_name: "Lugogo",
    address: "Plot 2-12 Lugogo Bypass",
    city: "Kampala",
    country: "Uganda",
    capacity: 5000,
    surface_type: "astroturf",
    has_lighting: true,
    has_parking: true,
    contact_email: "info@lugogostadium.ug",
    contact_phone: "+256-700-111-222",
    website: "https://lugogostadium.ug",
    image_url: "",
    status: "active",
  },
  {
    id: "venue_default_2",
    organization_id: "org_default_1",
    name: "Makerere University Hockey Pitch",
    short_name: "Makerere",
    address: "University Road, Makerere Hill",
    city: "Kampala",
    country: "Uganda",
    capacity: 2000,
    surface_type: "grass",
    has_lighting: false,
    has_parking: true,
    contact_email: "sports@mak.ac.ug",
    contact_phone: "+256-700-333-444",
    website: "https://mak.ac.ug/sports",
    image_url: "",
    status: "active",
  },
  {
    id: "venue_default_3",
    organization_id: "org_default_1",
    name: "Kyadondo Rugby Club",
    short_name: "Kyadondo",
    address: "Kira Road, Kamwokya",
    city: "Kampala",
    country: "Uganda",
    capacity: 3000,
    surface_type: "grass",
    has_lighting: true,
    has_parking: true,
    contact_email: "info@kyadondoclub.ug",
    contact_phone: "+256-700-555-666",
    website: "https://kyadondoclub.ug",
    image_url: "",
    status: "active",
  },
];

export function create_default_venues(): ScalarInput<Venue>[] {
  const now = new Date().toISOString();
  return DEFAULT_VENUES_SEEDS.map(
    (seed) =>
      ({ ...seed, created_at: now, updated_at: now }) as ScalarInput<Venue>,
  );
}
