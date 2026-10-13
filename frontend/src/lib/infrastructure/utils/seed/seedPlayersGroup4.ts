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

const WEATHERHEAD_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P4,
  first_name: "Alex",
  last_name: "Kibuuka",
  email: "alex.kibuuka@weatherheadhc.ug",
  phone: "+256-700-100-004",
  date_of_birth: "1996-02-10",
  height_cm: 179,
  weight_kg: 75,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Kibuuka",
  emergency_contact_phone: "+256-700-100-104",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P5,
  first_name: "Simon",
  last_name: "Otim",
  email: "simon.otim@weatherheadhc.ug",
  phone: "+256-700-100-005",
  date_of_birth: "1997-05-18",
  height_cm: 174,
  weight_kg: 71,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Agnes Otim",
  emergency_contact_phone: "+256-700-100-105",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P6,
  first_name: "Martha",
  last_name: "Adong",
  email: "martha.adong@weatherheadhc.ug",
  phone: "+256-700-100-006",
  date_of_birth: "1998-08-25",
  height_cm: 167,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "James Adong",
  emergency_contact_phone: "+256-700-100-106",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P7,
  first_name: "Paul",
  last_name: "Mugisha",
  email: "paul.mugisha@weatherheadhc.ug",
  phone: "+256-700-100-007",
  date_of_birth: "1995-11-12",
  height_cm: 181,
  weight_kg: 77,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Sarah Mugisha",
  emergency_contact_phone: "+256-700-100-107",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P8,
  first_name: "Irene",
  last_name: "Nassanga",
  email: "irene.nassanga@weatherheadhc.ug",
  phone: "+256-700-100-008",
  date_of_birth: "1999-03-07",
  height_cm: 165,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Tom Nassanga",
  emergency_contact_phone: "+256-700-100-108",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P9,
  first_name: "Richard",
  last_name: "Okware",
  email: "richard.okware@weatherheadhc.ug",
  phone: "+256-700-100-009",
  date_of_birth: "1996-07-30",
  height_cm: 176,
  weight_kg: 73,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Alice Okware",
  emergency_contact_phone: "+256-700-100-109",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P10,
  first_name: "Gloria",
  last_name: "Apio",
  email: "gloria.apio@weatherheadhc.ug",
  phone: "+256-700-100-010",
  date_of_birth: "1997-12-15",
  height_cm: 170,
  weight_kg: 64,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "David Apio",
  emergency_contact_phone: "+256-700-100-110",
  medical_notes: "",
  status: "active",
};

const WEATHERHEAD_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WEATHERHEAD_P11,
  first_name: "Charles",
  last_name: "Opolot",
  email: "charles.opolot@weatherheadhc.ug",
  phone: "+256-700-100-011",
  date_of_birth: "1995-04-20",
  height_cm: 183,
  weight_kg: 78,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Mary Opolot",
  emergency_contact_phone: "+256-700-100-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group4(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...WEATHERHEAD_P4_ROW, position_id: positions.lb },
    { ...WEATHERHEAD_P5_ROW, position_id: positions.rb },
    { ...WEATHERHEAD_P6_ROW, position_id: positions.cm },
    { ...WEATHERHEAD_P7_ROW, position_id: positions.lm },
    { ...WEATHERHEAD_P8_ROW, position_id: positions.rm },
    { ...WEATHERHEAD_P9_ROW, position_id: positions.lw },
    { ...WEATHERHEAD_P10_ROW, position_id: positions.rw },
    { ...WEATHERHEAD_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
