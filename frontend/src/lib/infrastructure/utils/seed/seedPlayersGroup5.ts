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

const KAMPALA_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P4,
  first_name: "Henry",
  last_name: "Kawuki",
  email: "henry.kawuki@kampalahc.ug",
  phone: "+256-700-200-004",
  date_of_birth: "1996-06-14",
  height_cm: 187,
  weight_kg: 82,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Joyce Kawuki",
  emergency_contact_phone: "+256-700-200-104",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P5,
  first_name: "Janet",
  last_name: "Atim",
  email: "janet.atim@kampalahc.ug",
  phone: "+256-700-200-005",
  date_of_birth: "1998-09-22",
  height_cm: 166,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Robert Atim",
  emergency_contact_phone: "+256-700-200-105",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P6,
  first_name: "Samuel",
  last_name: "Ojok",
  email: "samuel.ojok@kampalahc.ug",
  phone: "+256-700-200-006",
  date_of_birth: "1997-01-28",
  height_cm: 178,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Helen Ojok",
  emergency_contact_phone: "+256-700-200-106",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P7,
  first_name: "Rebecca",
  last_name: "Nanyonjo",
  email: "rebecca.nanyonjo@kampalahc.ug",
  phone: "+256-700-200-007",
  date_of_birth: "1999-04-05",
  height_cm: 169,
  weight_kg: 63,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Paul Nanyonjo",
  emergency_contact_phone: "+256-700-200-107",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P8,
  first_name: "Andrew",
  last_name: "Okoth",
  email: "andrew.okoth@kampalahc.ug",
  phone: "+256-700-200-008",
  date_of_birth: "1995-07-19",
  height_cm: 182,
  weight_kg: 77,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Okoth",
  emergency_contact_phone: "+256-700-200-108",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P9,
  first_name: "Doreen",
  last_name: "Akello",
  email: "doreen.akello@kampalahc.ug",
  phone: "+256-700-200-009",
  date_of_birth: "1998-10-11",
  height_cm: 164,
  weight_kg: 58,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Akello",
  emergency_contact_phone: "+256-700-200-109",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P10,
  first_name: "Vincent",
  last_name: "Otim",
  email: "vincent.otim@kampalahc.ug",
  phone: "+256-700-200-010",
  date_of_birth: "1996-12-03",
  height_cm: 177,
  weight_kg: 72,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Otim",
  emergency_contact_phone: "+256-700-200-110",
  medical_notes: "",
  status: "active",
};

const KAMPALA_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KAMPALA_P11,
  first_name: "Angela",
  last_name: "Nabirye",
  email: "angela.nabirye@kampalahc.ug",
  phone: "+256-700-200-011",
  date_of_birth: "1997-03-16",
  height_cm: 168,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "James Nabirye",
  emergency_contact_phone: "+256-700-200-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group5(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...KAMPALA_P4_ROW, position_id: positions.lb },
    { ...KAMPALA_P5_ROW, position_id: positions.rb },
    { ...KAMPALA_P6_ROW, position_id: positions.cm },
    { ...KAMPALA_P7_ROW, position_id: positions.lm },
    { ...KAMPALA_P8_ROW, position_id: positions.rm },
    { ...KAMPALA_P9_ROW, position_id: positions.lw },
    { ...KAMPALA_P10_ROW, position_id: positions.rw },
    { ...KAMPALA_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
