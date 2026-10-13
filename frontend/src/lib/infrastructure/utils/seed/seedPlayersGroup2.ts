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

const EMMANUEL_OKELLO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.EMMANUEL_OKELLO,
  first_name: "Emmanuel",
  last_name: "Okello",
  email: "emmanuel.okello@rocketshc.ug",
  phone: "+256-700-300-003",
  date_of_birth: "1997-08-10",
  height_cm: 188,
  weight_kg: 82,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Margaret Okello",
  emergency_contact_phone: "+256-700-300-103",
  medical_notes: "",
  status: "active",
};

const JUDITH_NAKATO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.JUDITH_NAKATO,
  first_name: "Judith",
  last_name: "Nakato",
  email: "judith.nakato@wananchihc.ug",
  phone: "+256-700-400-001",
  date_of_birth: "2001-06-20",
  height_cm: 170,
  weight_kg: 64,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "David Nakato",
  emergency_contact_phone: "+256-700-400-101",
  medical_notes: "",
  status: "active",
};

const PETER_DRAGO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.PETER_DRAGO,
  first_name: "Peter",
  last_name: "Drago",
  email: "peter.drago@wananchihc.ug",
  phone: "+256-700-400-002",
  date_of_birth: "1996-04-12",
  height_cm: 179,
  weight_kg: 75,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Alice Drago",
  emergency_contact_phone: "+256-700-400-102",
  medical_notes: "",
  status: "active",
};

const CHRISTINE_AMONGI_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.CHRISTINE_AMONGI,
  first_name: "Christine",
  last_name: "Amongi",
  email: "christine.amongi@wananchihc.ug",
  phone: "+256-700-400-003",
  date_of_birth: "1997-09-28",
  height_cm: 167,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Amongi",
  emergency_contact_phone: "+256-700-400-103",
  medical_notes: "",
  status: "active",
};

const STEVEN_MUKASA_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.STEVEN_MUKASA,
  first_name: "Steven",
  last_name: "Mukasa",
  email: "steven.mukasa@makerere.ug",
  phone: "+256-700-500-001",
  date_of_birth: "1999-01-15",
  height_cm: 184,
  weight_kg: 79,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rachel Mukasa",
  emergency_contact_phone: "+256-700-500-101",
  medical_notes: "",
  status: "active",
};

const HARRIET_NANDAWULA_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.HARRIET_NANDAWULA,
  first_name: "Harriet",
  last_name: "Nandawula",
  email: "harriet.nandawula@makerere.ug",
  phone: "+256-700-500-002",
  date_of_birth: "1998-07-03",
  height_cm: 172,
  weight_kg: 66,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Nandawula",
  emergency_contact_phone: "+256-700-500-102",
  medical_notes: "",
  status: "active",
};

const TIMOTHY_LUBEGA_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.TIMOTHY_LUBEGA,
  first_name: "Timothy",
  last_name: "Lubega",
  email: "timothy.lubega@makerere.ug",
  phone: "+256-700-500-003",
  date_of_birth: "2000-03-22",
  height_cm: 181,
  weight_kg: 77,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Esther Lubega",
  emergency_contact_phone: "+256-700-500-103",
  medical_notes: "",
  status: "active",
};

const GRACE_ACHOLA_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.GRACE_ACHOLA,
  first_name: "Grace",
  last_name: "Achola",
  email: "grace.achola@kyambogo.ug",
  phone: "+256-700-600-001",
  date_of_birth: "1995-11-08",
  height_cm: 169,
  weight_kg: 63,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Paul Achola",
  emergency_contact_phone: "+256-700-600-101",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group2(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...EMMANUEL_OKELLO_ROW, position_id: positions.cb },
    { ...JUDITH_NAKATO_ROW, position_id: positions.gk },
    { ...PETER_DRAGO_ROW, position_id: positions.sw },
    { ...CHRISTINE_AMONGI_ROW, position_id: positions.cb },
    { ...STEVEN_MUKASA_ROW, position_id: positions.gk },
    { ...HARRIET_NANDAWULA_ROW, position_id: positions.sw },
    { ...TIMOTHY_LUBEGA_ROW, position_id: positions.cb },
    { ...GRACE_ACHOLA_ROW, position_id: positions.gk },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
