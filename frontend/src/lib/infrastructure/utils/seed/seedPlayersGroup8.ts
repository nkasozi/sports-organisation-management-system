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

const MAKERERE_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P4,
  first_name: "Allan",
  last_name: "Ssebaggala",
  email: "allan.ssebaggala@makerere.ug",
  phone: "+256-700-500-004",
  date_of_birth: "1999-03-12",
  height_cm: 176,
  weight_kg: 72,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Joyce Ssebaggala",
  emergency_contact_phone: "+256-700-500-104",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P5,
  first_name: "Esther",
  last_name: "Nambi",
  email: "esther.nambi@makerere.ug",
  phone: "+256-700-500-005",
  date_of_birth: "2000-06-21",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Tom Nambi",
  emergency_contact_phone: "+256-700-500-105",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P6,
  first_name: "Oscar",
  last_name: "Kiwanuka",
  email: "oscar.kiwanuka@makerere.ug",
  phone: "+256-700-500-006",
  date_of_birth: "1998-09-04",
  height_cm: 183,
  weight_kg: 78,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Kiwanuka",
  emergency_contact_phone: "+256-700-500-106",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P7,
  first_name: "Diana",
  last_name: "Nalubwama",
  email: "diana.nalubwama@makerere.ug",
  phone: "+256-700-500-007",
  date_of_birth: "1999-12-18",
  height_cm: 166,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Nalubwama",
  emergency_contact_phone: "+256-700-500-107",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P8,
  first_name: "Frank",
  last_name: "Wamala",
  email: "frank.wamala@makerere.ug",
  phone: "+256-700-500-008",
  date_of_birth: "1997-02-26",
  height_cm: 179,
  weight_kg: 75,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Wamala",
  emergency_contact_phone: "+256-700-500-108",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P9,
  first_name: "Lillian",
  last_name: "Sempijja",
  email: "lillian.sempijja@makerere.ug",
  phone: "+256-700-500-009",
  date_of_birth: "2000-05-09",
  height_cm: 167,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Paul Sempijja",
  emergency_contact_phone: "+256-700-500-109",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P10,
  first_name: "Bruno",
  last_name: "Kasozi",
  email: "bruno.kasozi@makerere.ug",
  phone: "+256-700-500-010",
  date_of_birth: "1998-08-15",
  height_cm: 174,
  weight_kg: 71,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Sarah Kasozi",
  emergency_contact_phone: "+256-700-500-110",
  medical_notes: "",
  status: "active",
};

const MAKERERE_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.MAKERERE_P11,
  first_name: "Rita",
  last_name: "Nabisubi",
  email: "rita.nabisubi@makerere.ug",
  phone: "+256-700-500-011",
  date_of_birth: "1999-11-02",
  height_cm: 163,
  weight_kg: 57,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "James Nabisubi",
  emergency_contact_phone: "+256-700-500-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group8(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...MAKERERE_P4_ROW, position_id: positions.lb },
    { ...MAKERERE_P5_ROW, position_id: positions.rb },
    { ...MAKERERE_P6_ROW, position_id: positions.cm },
    { ...MAKERERE_P7_ROW, position_id: positions.lm },
    { ...MAKERERE_P8_ROW, position_id: positions.rm },
    { ...MAKERERE_P9_ROW, position_id: positions.lw },
    { ...MAKERERE_P10_ROW, position_id: positions.rw },
    { ...MAKERERE_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
