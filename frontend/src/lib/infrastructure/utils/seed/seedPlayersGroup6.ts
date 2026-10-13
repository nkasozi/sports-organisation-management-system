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

const ROCKETS_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P4,
  first_name: "Kenneth",
  last_name: "Amuge",
  email: "kenneth.amuge@rocketshc.ug",
  phone: "+256-700-300-004",
  date_of_birth: "1996-05-08",
  height_cm: 180,
  weight_kg: 76,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Mary Amuge",
  emergency_contact_phone: "+256-700-300-104",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P5,
  first_name: "Edith",
  last_name: "Ogwal",
  email: "edith.ogwal@rocketshc.ug",
  phone: "+256-700-300-005",
  date_of_birth: "1998-08-14",
  height_cm: 167,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Ogwal",
  emergency_contact_phone: "+256-700-300-105",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P6,
  first_name: "George",
  last_name: "Mugabi",
  email: "george.mugabi@rocketshc.ug",
  phone: "+256-700-300-006",
  date_of_birth: "1995-11-27",
  height_cm: 175,
  weight_kg: 72,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Sarah Mugabi",
  emergency_contact_phone: "+256-700-300-106",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P7,
  first_name: "Betty",
  last_name: "Owori",
  email: "betty.owori@rocketshc.ug",
  phone: "+256-700-300-007",
  date_of_birth: "1999-02-20",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Tom Owori",
  emergency_contact_phone: "+256-700-300-107",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P8,
  first_name: "Patrick",
  last_name: "Ochieng",
  email: "patrick.ochieng@rocketshc.ug",
  phone: "+256-700-300-008",
  date_of_birth: "1996-06-09",
  height_cm: 183,
  weight_kg: 79,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Irene Ochieng",
  emergency_contact_phone: "+256-700-300-108",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P9,
  first_name: "Winnie",
  last_name: "Akumu",
  email: "winnie.akumu@rocketshc.ug",
  phone: "+256-700-300-009",
  date_of_birth: "1997-09-15",
  height_cm: 166,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "David Akumu",
  emergency_contact_phone: "+256-700-300-109",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P10,
  first_name: "Dennis",
  last_name: "Olweny",
  email: "dennis.olweny@rocketshc.ug",
  phone: "+256-700-300-010",
  date_of_birth: "1995-12-22",
  height_cm: 179,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Joyce Olweny",
  emergency_contact_phone: "+256-700-300-110",
  medical_notes: "",
  status: "active",
};

const ROCKETS_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROCKETS_P11,
  first_name: "Carol",
  last_name: "Adoko",
  email: "carol.adoko@rocketshc.ug",
  phone: "+256-700-300-011",
  date_of_birth: "1998-04-01",
  height_cm: 168,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Peter Adoko",
  emergency_contact_phone: "+256-700-300-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group6(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...ROCKETS_P4_ROW, position_id: positions.lb },
    { ...ROCKETS_P5_ROW, position_id: positions.rb },
    { ...ROCKETS_P6_ROW, position_id: positions.cm },
    { ...ROCKETS_P7_ROW, position_id: positions.lm },
    { ...ROCKETS_P8_ROW, position_id: positions.rm },
    { ...ROCKETS_P9_ROW, position_id: positions.lw },
    { ...ROCKETS_P10_ROW, position_id: positions.rw },
    { ...ROCKETS_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
