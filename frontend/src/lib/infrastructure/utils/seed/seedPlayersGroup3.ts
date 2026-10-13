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

const ISAAC_KATO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ISAAC_KATO,
  first_name: "Isaac",
  last_name: "Kato",
  email: "isaac.kato@kyambogo.ug",
  phone: "+256-700-600-002",
  date_of_birth: "1997-05-14",
  height_cm: 177,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Martha Kato",
  emergency_contact_phone: "+256-700-600-102",
  medical_notes: "",
  status: "active",
};

const JANE_KASULE_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.JANE_KASULE,
  first_name: "Jane",
  last_name: "Kasule",
  email: "jane.kasule@kyambogo.ug",
  phone: "+256-700-600-003",
  date_of_birth: "1999-08-27",
  height_cm: 166,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Robert Kasule",
  emergency_contact_phone: "+256-700-600-103",
  medical_notes: "",
  status: "active",
};

const MICHAEL_OPIO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MICHAEL_OPIO,
  first_name: "Michael",
  last_name: "Opio",
  email: "michael.opio@simbahc.ug",
  phone: "+256-700-700-001",
  date_of_birth: "1996-02-19",
  height_cm: 186,
  weight_kg: 81,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Dorothy Opio",
  emergency_contact_phone: "+256-700-700-101",
  medical_notes: "",
  status: "active",
};

const RUTH_ACAN_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.RUTH_ACAN,
  first_name: "Ruth",
  last_name: "Acan",
  email: "ruth.acan@simbahc.ug",
  phone: "+256-700-700-002",
  date_of_birth: "1998-10-05",
  height_cm: 168,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Francis Acan",
  emergency_contact_phone: "+256-700-700-102",
  medical_notes: "",
  status: "active",
};

const FRANCIS_BYEKWASO_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.FRANCIS_BYEKWASO,
  first_name: "Francis",
  last_name: "Byekwaso",
  email: "francis.byekwaso@simbahc.ug",
  phone: "+256-700-700-003",
  date_of_birth: "1995-06-11",
  height_cm: 180,
  weight_kg: 76,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Agnes Byekwaso",
  emergency_contact_phone: "+256-700-700-103",
  medical_notes: "",
  status: "active",
};

const SHARON_NABATANZI_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.SHARON_NABATANZI,
  first_name: "Sharon",
  last_name: "Nabatanzi",
  email: "sharon.nabatanzi@strikershc.ug",
  phone: "+256-700-800-001",
  date_of_birth: "1997-12-23",
  height_cm: 171,
  weight_kg: 65,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Andrew Nabatanzi",
  emergency_contact_phone: "+256-700-800-101",
  medical_notes: "",
  status: "active",
};

const ROBERT_KIGGUNDU_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.ROBERT_KIGGUNDU,
  first_name: "Robert",
  last_name: "Kiggundu",
  email: "robert.kiggundu@strikershc.ug",
  phone: "+256-700-800-002",
  date_of_birth: "1996-09-17",
  height_cm: 183,
  weight_kg: 79,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Beatrice Kiggundu",
  emergency_contact_phone: "+256-700-800-102",
  medical_notes: "",
  status: "active",
};

const FLORENCE_NAMUTEBI_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.FLORENCE_NAMUTEBI,
  first_name: "Florence",
  last_name: "Namutebi",
  email: "florence.namutebi@strikershc.ug",
  phone: "+256-700-800-003",
  date_of_birth: "1999-04-08",
  height_cm: 164,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Stephen Namutebi",
  emergency_contact_phone: "+256-700-800-103",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group3(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...ISAAC_KATO_ROW, position_id: positions.sw },
    { ...JANE_KASULE_ROW, position_id: positions.cb },
    { ...MICHAEL_OPIO_ROW, position_id: positions.gk },
    { ...RUTH_ACAN_ROW, position_id: positions.sw },
    { ...FRANCIS_BYEKWASO_ROW, position_id: positions.cb },
    { ...SHARON_NABATANZI_ROW, position_id: positions.gk },
    { ...ROBERT_KIGGUNDU_ROW, position_id: positions.sw },
    { ...FLORENCE_NAMUTEBI_ROW, position_id: positions.cb },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
