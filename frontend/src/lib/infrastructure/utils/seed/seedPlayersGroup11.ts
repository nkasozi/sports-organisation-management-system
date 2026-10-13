import type { Player } from "../../../core/entities/Player";
import type { ScalarValueInput } from "../../../core/types/DomainScalars";
import type { PositionIds } from "./seedPlayerIds";
import { SEED_PLAYER_IDS } from "./seedPlayerIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<
    Omit<Player, "gender_id">
  >,
  "position_id" | "organization_id" | "created_at" | "updated_at"
>;

const STRIKERS_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P4,
  first_name: "Victor",
  last_name: "Ouma",
  email: "victor.ouma@strikershc.ug",
  phone: "+256-700-800-004",
  date_of_birth: "1996-02-17",
  height_cm: 187,
  weight_kg: 82,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Ouma",
  emergency_contact_phone: "+256-700-800-104",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P5,
  first_name: "Lydia",
  last_name: "Akurut",
  email: "lydia.akurut@strikershc.ug",
  phone: "+256-700-800-005",
  date_of_birth: "1998-05-24",
  height_cm: 166,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Tom Akurut",
  emergency_contact_phone: "+256-700-800-105",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P6,
  first_name: "Emmanuel",
  last_name: "Opio",
  email: "emmanuel.opio@strikershc.ug",
  phone: "+256-700-800-006",
  date_of_birth: "1995-08-10",
  height_cm: 178,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Sarah Opio",
  emergency_contact_phone: "+256-700-800-106",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P7,
  first_name: "Christine",
  last_name: "Alupo",
  email: "christine.alupo@strikershc.ug",
  phone: "+256-700-800-007",
  date_of_birth: "1999-11-30",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Peter Alupo",
  emergency_contact_phone: "+256-700-800-107",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P8,
  first_name: "Moses",
  last_name: "Orech",
  email: "moses.orech@strikershc.ug",
  phone: "+256-700-800-008",
  date_of_birth: "1996-06-21",
  height_cm: 183,
  weight_kg: 79,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Joyce Orech",
  emergency_contact_phone: "+256-700-800-108",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P9,
  first_name: "Miriam",
  last_name: "Achan",
  email: "miriam.achan@strikershc.ug",
  phone: "+256-700-800-009",
  date_of_birth: "1997-09-14",
  height_cm: 164,
  weight_kg: 58,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Achan",
  emergency_contact_phone: "+256-700-800-109",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P10,
  first_name: "Brian",
  last_name: "Olupot",
  email: "brian.olupot@strikershc.ug",
  phone: "+256-700-800-010",
  date_of_birth: "1995-12-05",
  height_cm: 180,
  weight_kg: 76,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Olupot",
  emergency_contact_phone: "+256-700-800-110",
  medical_notes: "",
  status: "active",
};

const STRIKERS_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STRIKERS_P11,
  first_name: "Dorothy",
  last_name: "Achen",
  email: "dorothy.achen@strikershc.ug",
  phone: "+256-700-800-011",
  date_of_birth: "1998-03-28",
  height_cm: 169,
  weight_kg: 63,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Achen",
  emergency_contact_phone: "+256-700-800-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group11(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...STRIKERS_P4_ROW, position_id: positions.lb },
    { ...STRIKERS_P5_ROW, position_id: positions.rb },
    { ...STRIKERS_P6_ROW, position_id: positions.cm },
    { ...STRIKERS_P7_ROW, position_id: positions.lm },
    { ...STRIKERS_P8_ROW, position_id: positions.rm },
    { ...STRIKERS_P9_ROW, position_id: positions.lw },
    { ...STRIKERS_P10_ROW, position_id: positions.rw },
    { ...STRIKERS_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
