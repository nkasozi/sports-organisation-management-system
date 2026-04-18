import type { Official } from "../../../core/entities/Official";
import { DEFAULT_OFFICIAL_AVATAR } from "../../../core/entities/Official";
import type { ScalarValueInput } from "../../../core/types/DomainScalars";
import { generate_current_timestamp, SEED_OFFICIAL_IDS } from "./seedIds";
import { resolve_seed_gender_id_for_first_name } from "./seedPlayerIds";

export function create_seed_officials(
  organization_id: ScalarValueInput<Official["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<Official>[] {
  const now = generate_current_timestamp();

  const officials_without_gender: import("$lib/core/types/DomainScalars").ScalarInput<
    Omit<Official, "gender_id">
  >[] = [
    {
      id: SEED_OFFICIAL_IDS.MICHAEL_ANDERSON,
      first_name: "Charles",
      last_name: "Kateregga",
      email: "charles.kateregga@ugandahockey.org",
      phone: "+256-700-900-001",
      date_of_birth: "1978-06-15",
      organization_id: organization_id,
      years_of_experience: 15,
      nationality: "Uganda",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Susan Kateregga",
      emergency_contact_phone: "+256-700-900-101",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_OFFICIAL_IDS.SARAH_JOHNSON,
      first_name: "Agnes",
      last_name: "Namutebi",
      email: "agnes.namutebi@ugandahockey.org",
      phone: "+256-700-900-002",
      date_of_birth: "1985-02-20",
      organization_id: organization_id,
      years_of_experience: 10,
      nationality: "Uganda",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Tom Namutebi",
      emergency_contact_phone: "+256-700-900-102",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_OFFICIAL_IDS.JAMES_WILLIAMS,
      first_name: "Samuel",
      last_name: "Okwera",
      email: "samuel.okwera@ugandahockey.org",
      phone: "+256-700-900-003",
      date_of_birth: "1982-09-10",
      organization_id: organization_id,
      years_of_experience: 12,
      nationality: "Uganda",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Kate Okwera",
      emergency_contact_phone: "+256-700-900-103",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_OFFICIAL_IDS.EMILY_DAVIS,
      first_name: "Prossy",
      last_name: "Akello",
      email: "prossy.akello@ugandahockey.org",
      phone: "+256-700-900-004",
      date_of_birth: "1990-11-28",
      organization_id: organization_id,
      years_of_experience: 7,
      nationality: "Uganda",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Mark Akello",
      emergency_contact_phone: "+256-700-900-104",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];

  return officials_without_gender.map((official) => ({
    ...official,
    gender_id: resolve_seed_gender_id_for_first_name(official.first_name),
  }));
}
