import type { CompetitionTeam } from "../../../core/entities/CompetitionTeam";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<CompetitionTeam>,
  "registration_date" | "created_at" | "updated_at"
>;

const ROW_1: SeedRow = {
  id: "comp_team_default_6",
  competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
  team_id: SEED_TEAM_IDS.KAMPALA_HC,
  seed_number: 2,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_2: SeedRow = {
  id: "comp_team_default_7",
  competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
  team_id: SEED_TEAM_IDS.ROCKETS_HC,
  seed_number: 3,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_3: SeedRow = {
  id: "comp_team_default_nhl_wananchi",
  competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
  team_id: SEED_TEAM_IDS.WANANCHI_HC,
  seed_number: 4,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_4: SeedRow = {
  id: "comp_team_default_8",
  competition_id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
  team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  seed_number: 1,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_5: SeedRow = {
  id: "comp_team_default_9",
  competition_id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
  team_id: SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
  seed_number: 2,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_6: SeedRow = {
  id: "comp_team_default_10",
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  team_id: SEED_TEAM_IDS.SIMBA_HC,
  seed_number: 1,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

const ROW_7: SeedRow = {
  id: "comp_team_default_11",
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  team_id: SEED_TEAM_IDS.STRIKERS_HC,
  seed_number: 2,
  group_name: "",
  points: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  notes: "",
  status: "confirmed",
};

export function create_seed_competition_teams_part2(): import("$lib/core/types/DomainScalars").ScalarInput<CompetitionTeam>[] {
  const now = generate_current_timestamp();
  const registration_date = new Date().toISOString().split("T")[0];

  return [
    { ...ROW_1 },
    { ...ROW_2 },
    { ...ROW_3 },
    { ...ROW_4 },
    { ...ROW_5 },
    { ...ROW_6 },
    { ...ROW_7 },
  ].map((row) => ({
    ...row,
    registration_date,
    created_at: now,
    updated_at: now,
  }));
}
