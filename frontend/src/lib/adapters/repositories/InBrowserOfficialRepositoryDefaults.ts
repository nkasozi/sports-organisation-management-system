import type { Official } from "../../core/entities/Official";
import { DEFAULT_OFFICIAL_AVATAR } from "../../core/entities/Official";
import type { ScalarInput } from "../../core/types/DomainScalars";

const DEFAULT_OFFICIALS_SEEDS: Omit<
  ScalarInput<Official>,
  "created_at" | "updated_at"
>[] = [
  {
    id: "official_default_1",
    first_name: "James",
    last_name: "Mukasa",
    gender_id: "gender_default_male",
    email: "james.mukasa@ugandahockey.org",
    phone: "+256-700-111-222",
    date_of_birth: "1985-03-15",
    organization_id: "org_default_1",
    years_of_experience: 12,
    nationality: "Ugandan",
    profile_image_url: DEFAULT_OFFICIAL_AVATAR,
    emergency_contact_name: "Mary Mukasa",
    emergency_contact_phone: "+256-700-111-333",
    notes: "Senior referee with international certification",
    status: "active",
  },
  {
    id: "official_default_2",
    first_name: "Sarah",
    last_name: "Nakato",
    gender_id: "gender_default_female",
    email: "sarah.nakato@ugandahockey.org",
    phone: "+256-700-222-333",
    date_of_birth: "1990-07-22",
    organization_id: "org_default_1",
    years_of_experience: 8,
    nationality: "Ugandan",
    profile_image_url: DEFAULT_OFFICIAL_AVATAR,
    emergency_contact_name: "Peter Nakato",
    emergency_contact_phone: "+256-700-222-444",
    notes: "Technical official specializing in timekeeping",
    status: "active",
  },
  {
    id: "official_default_3",
    first_name: "David",
    last_name: "Ochieng",
    gender_id: "gender_default_male",
    email: "david.ochieng@ugandahockey.org",
    phone: "+256-700-333-444",
    date_of_birth: "1988-11-08",
    organization_id: "org_default_1",
    years_of_experience: 10,
    nationality: "Ugandan",
    profile_image_url: DEFAULT_OFFICIAL_AVATAR,
    emergency_contact_name: "Grace Ochieng",
    emergency_contact_phone: "+256-700-333-555",
    notes: "Umpire with East African certification",
    status: "active",
  },
];

export function create_default_officials(): ScalarInput<Official>[] {
  const now = new Date().toISOString();
  return DEFAULT_OFFICIALS_SEEDS.map(
    (seed) =>
      ({ ...seed, created_at: now, updated_at: now }) as ScalarInput<Official>,
  );
}
