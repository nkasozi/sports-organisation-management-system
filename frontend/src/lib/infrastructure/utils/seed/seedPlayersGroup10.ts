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

const SIMBA_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P4,
  first_name: "Nathan",
  last_name: "Ogwang",
  email: "nathan.ogwang@simbahc.ug",
  phone: "+256-700-700-004",
  date_of_birth: "1996-04-28",
  height_cm: 180,
  weight_kg: 76,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Ogwang",
  emergency_contact_phone: "+256-700-700-104",
  medical_notes: "",
  status: "active",
};

const SIMBA_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P5,
  first_name: "Sylvia",
  last_name: "Amono",
  email: "sylvia.amono@simbahc.ug",
  phone: "+256-700-700-005",
  date_of_birth: "1998-07-15",
  height_cm: 167,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Amono",
  emergency_contact_phone: "+256-700-700-105",
  medical_notes: "",
  status: "active",
};

const SIMBA_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P6,
  first_name: "Gerald",
  last_name: "Okiring",
  email: "gerald.okiring@simbahc.ug",
  phone: "+256-700-700-006",
  date_of_birth: "1995-10-03",
  height_cm: 182,
  weight_kg: 78,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Okiring",
  emergency_contact_phone: "+256-700-700-106",
  medical_notes: "",
  status: "active",
};

const SIMBA_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P7,
  first_name: "Stella",
  last_name: "Alowo",
  email: "stella.alowo@simbahc.ug",
  phone: "+256-700-700-007",
  date_of_birth: "1999-01-19",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Alowo",
  emergency_contact_phone: "+256-700-700-107",
  medical_notes: "",
  status: "active",
};

const SIMBA_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P8,
  first_name: "Ivan",
  last_name: "Odoch",
  email: "ivan.odoch@simbahc.ug",
  phone: "+256-700-700-008",
  date_of_birth: "1996-08-06",
  height_cm: 179,
  weight_kg: 75,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Mary Odoch",
  emergency_contact_phone: "+256-700-700-108",
  medical_notes: "",
  status: "active",
};

const SIMBA_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P9,
  first_name: "Anita",
  last_name: "Opoka",
  email: "anita.opoka@simbahc.ug",
  phone: "+256-700-700-009",
  date_of_birth: "1997-11-22",
  height_cm: 166,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "David Opoka",
  emergency_contact_phone: "+256-700-700-109",
  medical_notes: "",
  status: "active",
};

const SIMBA_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P10,
  first_name: "Ronald",
  last_name: "Odong",
  email: "ronald.odong@simbahc.ug",
  phone: "+256-700-700-010",
  date_of_birth: "1995-04-11",
  height_cm: 181,
  weight_kg: 77,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Joyce Odong",
  emergency_contact_phone: "+256-700-700-110",
  medical_notes: "",
  status: "active",
};

const SIMBA_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SIMBA_P11,
  first_name: "Eva",
  last_name: "Aguti",
  email: "eva.aguti@simbahc.ug",
  phone: "+256-700-700-011",
  date_of_birth: "1998-09-08",
  height_cm: 168,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Paul Aguti",
  emergency_contact_phone: "+256-700-700-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group10(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...SIMBA_P4_ROW, position_id: positions.lb },
    { ...SIMBA_P5_ROW, position_id: positions.rb },
    { ...SIMBA_P6_ROW, position_id: positions.cm },
    { ...SIMBA_P7_ROW, position_id: positions.lm },
    { ...SIMBA_P8_ROW, position_id: positions.rm },
    { ...SIMBA_P9_ROW, position_id: positions.lw },
    { ...SIMBA_P10_ROW, position_id: positions.rw },
    { ...SIMBA_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
