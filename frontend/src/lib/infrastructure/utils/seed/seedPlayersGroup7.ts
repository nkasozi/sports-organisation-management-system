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

const WANANCHI_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P4,
  first_name: "Martin",
  last_name: "Omara",
  email: "martin.omara@wananchihc.ug",
  phone: "+256-700-400-004",
  date_of_birth: "1996-01-17",
  height_cm: 186,
  weight_kg: 81,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Omara",
  emergency_contact_phone: "+256-700-400-104",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P5,
  first_name: "Susan",
  last_name: "Angom",
  email: "susan.angom@wananchihc.ug",
  phone: "+256-700-400-005",
  date_of_birth: "1998-04-24",
  height_cm: 167,
  weight_kg: 61,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Paul Angom",
  emergency_contact_phone: "+256-700-400-105",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P6,
  first_name: "Edward",
  last_name: "Otema",
  email: "edward.otema@wananchihc.ug",
  phone: "+256-700-400-006",
  date_of_birth: "1995-07-11",
  height_cm: 177,
  weight_kg: 73,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Otema",
  emergency_contact_phone: "+256-700-400-106",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P7,
  first_name: "Jennifer",
  last_name: "Achieng",
  email: "jennifer.achieng@wananchihc.ug",
  phone: "+256-700-400-007",
  date_of_birth: "1999-10-06",
  height_cm: 164,
  weight_kg: 58,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Simon Achieng",
  emergency_contact_phone: "+256-700-400-107",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P8,
  first_name: "David",
  last_name: "Obua",
  email: "david.obua@wananchihc.ug",
  phone: "+256-700-400-008",
  date_of_birth: "1996-08-19",
  height_cm: 181,
  weight_kg: 76,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Sarah Obua",
  emergency_contact_phone: "+256-700-400-108",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P9,
  first_name: "Prossy",
  last_name: "Odongo",
  email: "prossy.odongo@wananchihc.ug",
  phone: "+256-700-400-009",
  date_of_birth: "1997-11-28",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "James Odongo",
  emergency_contact_phone: "+256-700-400-109",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P10,
  first_name: "Joseph",
  last_name: "Okumu",
  email: "joseph.okumu@wananchihc.ug",
  phone: "+256-700-400-010",
  date_of_birth: "1995-02-14",
  height_cm: 178,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Mary Okumu",
  emergency_contact_phone: "+256-700-400-110",
  medical_notes: "",
  status: "active",
};

const WANANCHI_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.WANANCHI_P11,
  first_name: "Brenda",
  last_name: "Otieno",
  email: "brenda.otieno@wananchihc.ug",
  phone: "+256-700-400-011",
  date_of_birth: "1998-05-07",
  height_cm: 169,
  weight_kg: 63,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Otieno",
  emergency_contact_phone: "+256-700-400-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group7(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...WANANCHI_P4_ROW, position_id: positions.lb },
    { ...WANANCHI_P5_ROW, position_id: positions.rb },
    { ...WANANCHI_P6_ROW, position_id: positions.cm },
    { ...WANANCHI_P7_ROW, position_id: positions.lm },
    { ...WANANCHI_P8_ROW, position_id: positions.rm },
    { ...WANANCHI_P9_ROW, position_id: positions.lw },
    { ...WANANCHI_P10_ROW, position_id: positions.rw },
    { ...WANANCHI_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
