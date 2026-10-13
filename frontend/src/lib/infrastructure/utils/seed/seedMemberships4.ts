import type { PlayerTeamMembership } from "../../../core/entities/PlayerTeamMembership";
import {
  generate_current_timestamp,
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";
import { SEED_PLAYER_IDS } from "./seedPlayerIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<PlayerTeamMembership>,
  "created_at" | "updated_at"
>;

const ROW_1: SeedRow = {
  id: "player_team_membership_default_46",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P9,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 9,
  status: "active",
};

const ROW_2: SeedRow = {
  id: "player_team_membership_default_47",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P10,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 12,
  status: "active",
};

const ROW_3: SeedRow = {
  id: "player_team_membership_default_48",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P11,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 10,
  status: "active",
};

const ROW_4: SeedRow = {
  id: "player_team_membership_default_49",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P4,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_5: SeedRow = {
  id: "player_team_membership_default_50",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P5,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 6,
  status: "active",
};

const ROW_6: SeedRow = {
  id: "player_team_membership_default_51",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P6,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  start_date: "2024-01-01",
  jersey_number: 5,
  status: "active",
};

const ROW_7: SeedRow = {
  id: "player_team_membership_default_52",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P7,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 7,
  status: "active",
};

const ROW_8: SeedRow = {
  id: "player_team_membership_default_53",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P8,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  start_date: "2024-01-01",
  jersey_number: 7,
  status: "active",
};

const ROW_9: SeedRow = {
  id: "player_team_membership_default_54",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P9,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 8,
  status: "active",
};

const ROW_10: SeedRow = {
  id: "player_team_membership_default_55",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P10,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  start_date: "2024-01-01",
  jersey_number: 12,
  status: "active",
};

const ROW_11: SeedRow = {
  id: "player_team_membership_default_56",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WANANCHI_P11,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 9,
  status: "active",
};

const ROW_12: SeedRow = {
  id: "player_team_membership_default_57",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.MAKERERE_P4,
  team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  start_date: "2024-01-01",
  jersey_number: 5,
  status: "active",
};

const ROW_13: SeedRow = {
  id: "player_team_membership_default_58",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.MAKERERE_P5,
  team_id: SEED_TEAM_IDS.WANANCHI_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 4,
  status: "active",
};

const ROW_14: SeedRow = {
  id: "player_team_membership_default_59",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.MAKERERE_P6,
  team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  start_date: "2024-01-01",
  jersey_number: 7,
  status: "active",
};

const ROW_15: SeedRow = {
  id: "player_team_membership_default_60",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.MAKERERE_P7,
  team_id: SEED_TEAM_IDS.WANANCHI_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

export function create_seed_memberships_part4(): import("$lib/core/types/DomainScalars").ScalarInput<PlayerTeamMembership>[] {
  const now = generate_current_timestamp();

  return [
    { ...ROW_1 },
    { ...ROW_2 },
    { ...ROW_3 },
    { ...ROW_4 },
    { ...ROW_5 },
    { ...ROW_6 },
    { ...ROW_7 },
    { ...ROW_8 },
    { ...ROW_9 },
    { ...ROW_10 },
    { ...ROW_11 },
    { ...ROW_12 },
    { ...ROW_13 },
    { ...ROW_14 },
    { ...ROW_15 },
  ].map((row) => ({ ...row, created_at: now, updated_at: now }));
}
