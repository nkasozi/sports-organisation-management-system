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

const KYAMBOGO_P4_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P4,
  first_name: "Kevin",
  last_name: "Balikuddembe",
  email: "kevin.balikuddembe@kyambogo.ug",
  phone: "+256-700-600-004",
  date_of_birth: "1998-01-23",
  height_cm: 188,
  weight_kg: 83,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Rose Balikuddembe",
  emergency_contact_phone: "+256-700-600-104",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P5_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P5,
  first_name: "Joy",
  last_name: "Nakimera",
  email: "joy.nakimera@kyambogo.ug",
  phone: "+256-700-600-005",
  date_of_birth: "2000-04-10",
  height_cm: 165,
  weight_kg: 59,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Charles Nakimera",
  emergency_contact_phone: "+256-700-600-105",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P6_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P6,
  first_name: "Rogers",
  last_name: "Ssempala",
  email: "rogers.ssempala@kyambogo.ug",
  phone: "+256-700-600-006",
  date_of_birth: "1997-07-18",
  height_cm: 178,
  weight_kg: 74,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Grace Ssempala",
  emergency_contact_phone: "+256-700-600-106",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P7_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P7,
  first_name: "Phiona",
  last_name: "Nakabuye",
  email: "phiona.nakabuye@kyambogo.ug",
  phone: "+256-700-600-007",
  date_of_birth: "1999-10-25",
  height_cm: 166,
  weight_kg: 60,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "David Nakabuye",
  emergency_contact_phone: "+256-700-600-107",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P8_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P8,
  first_name: "Julius",
  last_name: "Muwanga",
  email: "julius.muwanga@kyambogo.ug",
  phone: "+256-700-600-008",
  date_of_birth: "1996-03-14",
  height_cm: 182,
  weight_kg: 77,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Alice Muwanga",
  emergency_contact_phone: "+256-700-600-108",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P9_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P9,
  first_name: "Mercy",
  last_name: "Nansubuga",
  email: "mercy.nansubuga@kyambogo.ug",
  phone: "+256-700-600-009",
  date_of_birth: "1998-06-07",
  height_cm: 164,
  weight_kg: 58,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Tom Nansubuga",
  emergency_contact_phone: "+256-700-600-109",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P10_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P10,
  first_name: "Tony",
  last_name: "Kyambadde",
  email: "tony.kyambadde@kyambogo.ug",
  phone: "+256-700-600-010",
  date_of_birth: "1997-09-20",
  height_cm: 177,
  weight_kg: 73,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Susan Kyambadde",
  emergency_contact_phone: "+256-700-600-110",
  medical_notes: "",
  status: "active",
};

const KYAMBOGO_P11_ROW: SeedRow = {
  id: SEED_PLAYER_IDS.KYAMBOGO_P11,
  first_name: "Sandra",
  last_name: "Nabbanja",
  email: "sandra.nabbanja@kyambogo.ug",
  phone: "+256-700-600-011",
  date_of_birth: "2000-01-12",
  height_cm: 168,
  weight_kg: 62,
  nationality: "Uganda",
  profile_image_url: "",
  emergency_contact_name: "Peter Nabbanja",
  emergency_contact_phone: "+256-700-600-111",
  medical_notes: "",
  status: "active",
};

export function create_seed_players_group9(
  positions: PositionIds,
  organization_id: ScalarValueInput<
    Omit<Player, "gender_id">["organization_id"]
  >,
  now: Omit<Player, "gender_id">["created_at"],
): import("$lib/core/types/DomainScalars").ScalarInput<
  Omit<Player, "gender_id">
>[] {
  return [
    { ...KYAMBOGO_P4_ROW, position_id: positions.lb },
    { ...KYAMBOGO_P5_ROW, position_id: positions.rb },
    { ...KYAMBOGO_P6_ROW, position_id: positions.cm },
    { ...KYAMBOGO_P7_ROW, position_id: positions.lm },
    { ...KYAMBOGO_P8_ROW, position_id: positions.rm },
    { ...KYAMBOGO_P9_ROW, position_id: positions.lw },
    { ...KYAMBOGO_P10_ROW, position_id: positions.rw },
    { ...KYAMBOGO_P11_ROW, position_id: positions.cf },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
