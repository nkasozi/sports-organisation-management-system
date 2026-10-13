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
  id: "player_team_membership_default_31",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WEATHERHEAD_P10,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 11,
  status: "active",
};

const ROW_2: SeedRow = {
  id: "player_team_membership_default_32",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.WEATHERHEAD_P11,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
  start_date: "2024-01-01",
  jersey_number: 13,
  status: "active",
};

const ROW_3: SeedRow = {
  id: "player_team_membership_default_33",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P4,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_4: SeedRow = {
  id: "player_team_membership_default_34",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P5,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 5,
  status: "active",
};

const ROW_5: SeedRow = {
  id: "player_team_membership_default_35",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P6,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  start_date: "2024-01-01",
  jersey_number: 6,
  status: "active",
};

const ROW_6: SeedRow = {
  id: "player_team_membership_default_36",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P7,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 2,
  status: "active",
};

const ROW_7: SeedRow = {
  id: "player_team_membership_default_37",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P8,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  start_date: "2024-01-01",
  jersey_number: 9,
  status: "active",
};

const ROW_8: SeedRow = {
  id: "player_team_membership_default_38",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P9,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 3,
  status: "active",
};

const ROW_9: SeedRow = {
  id: "player_team_membership_default_39",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P10,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  start_date: "2024-01-01",
  jersey_number: 12,
  status: "active",
};

const ROW_10: SeedRow = {
  id: "player_team_membership_default_40",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.KAMPALA_P11,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 4,
  status: "active",
};

const ROW_11: SeedRow = {
  id: "player_team_membership_default_41",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P4,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 4,
  status: "active",
};

const ROW_12: SeedRow = {
  id: "player_team_membership_default_42",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P5,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 7,
  status: "active",
};

const ROW_13: SeedRow = {
  id: "player_team_membership_default_43",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P6,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 8,
  status: "active",
};

const ROW_14: SeedRow = {
  id: "player_team_membership_default_44",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P7,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 8,
  status: "active",
};

const ROW_15: SeedRow = {
  id: "player_team_membership_default_45",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.ROCKETS_P8,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 10,
  status: "active",
};

export function create_seed_memberships_part3(): import("$lib/core/types/DomainScalars").ScalarInput<PlayerTeamMembership>[] {
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
