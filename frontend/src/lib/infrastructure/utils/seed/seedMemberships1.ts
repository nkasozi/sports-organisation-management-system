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
  id: "player_team_membership_default_1",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.DENIS_ONYANGO,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
  start_date: "2024-01-01",
  jersey_number: 9,
  status: "active",
};

const ROW_2: SeedRow = {
  id: "player_team_membership_default_2",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.BRIAN_SSALI,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
  start_date: "2024-01-01",
  jersey_number: 10,
  status: "active",
};

const ROW_3: SeedRow = {
  id: "player_team_membership_default_3",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.JOSEPH_MUSOKE,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_4: SeedRow = {
  id: "player_team_membership_default_4",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.RONALD_MUKIIBI,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  start_date: "2024-01-01",
  jersey_number: 11,
  status: "active",
};

const ROW_5: SeedRow = {
  id: "player_team_membership_default_5",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.SARAH_NAMUGWANYA,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 3,
  status: "active",
};

const ROW_6: SeedRow = {
  id: "player_team_membership_default_6",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.PATRICIA_APOLOT,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 4,
  status: "active",
};

const ROW_7: SeedRow = {
  id: "player_team_membership_default_7",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.DANIEL_WASSWA,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 5,
  status: "active",
};

const ROW_8: SeedRow = {
  id: "player_team_membership_default_8",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.MOSES_ALOWO,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 7,
  status: "active",
};

const ROW_9: SeedRow = {
  id: "player_team_membership_default_9",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.EMMANUEL_OKELLO,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_10: SeedRow = {
  id: "player_team_membership_default_10",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.JUDITH_NAKATO,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_11: SeedRow = {
  id: "player_team_membership_default_11",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.PETER_DRAGO,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  start_date: "2024-01-01",
  jersey_number: 11,
  status: "active",
};

const ROW_12: SeedRow = {
  id: "player_team_membership_default_12",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.CHRISTINE_AMONGI,
  team_id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 5,
  status: "active",
};

const ROW_13: SeedRow = {
  id: "player_team_membership_default_13",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.STEVEN_MUKASA,
  team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  start_date: "2024-01-01",
  jersey_number: 1,
  status: "active",
};

const ROW_14: SeedRow = {
  id: "player_team_membership_default_14",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.HARRIET_NANDAWULA,
  team_id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  start_date: "2024-01-01",
  jersey_number: 6,
  status: "active",
};

const ROW_15: SeedRow = {
  id: "player_team_membership_default_15",
  organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  player_id: SEED_PLAYER_IDS.TIMOTHY_LUBEGA,
  team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  start_date: "2024-01-01",
  jersey_number: 4,
  status: "active",
};

export function create_seed_memberships_part1(): import("$lib/core/types/DomainScalars").ScalarInput<PlayerTeamMembership>[] {
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
