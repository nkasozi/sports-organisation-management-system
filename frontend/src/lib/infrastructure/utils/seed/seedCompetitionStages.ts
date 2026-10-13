import type { CompetitionStage } from "../../../core/entities/CompetitionStage";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_STAGE_IDS,
} from "./seedIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<CompetitionStage>,
  "created_at" | "updated_at"
>;

const EASTER_CUP_POOL_STAGE_ROW: SeedRow = {
  id: SEED_STAGE_IDS.EASTER_CUP_POOL_STAGE,
  competition_id: SEED_COMPETITION_IDS.EASTER_CUP_2026,
  name: "Pool Stage",
  stage_type: "group_stage",
  stage_order: 1,
  status: "active",
};

const EASTER_CUP_SEMI_FINALS_ROW: SeedRow = {
  id: SEED_STAGE_IDS.EASTER_CUP_SEMI_FINALS,
  competition_id: SEED_COMPETITION_IDS.EASTER_CUP_2026,
  name: "Semi Finals",
  stage_type: "knockout_stage",
  stage_order: 2,
  status: "active",
};

const EASTER_CUP_FINAL_ROW: SeedRow = {
  id: SEED_STAGE_IDS.EASTER_CUP_FINAL,
  competition_id: SEED_COMPETITION_IDS.EASTER_CUP_2026,
  name: "Final",
  stage_type: "one_off_stage",
  stage_order: 3,
  status: "active",
};

const UGANDA_CUP_ROUND_OF_16_ROW: SeedRow = {
  id: SEED_STAGE_IDS.UGANDA_CUP_ROUND_OF_16,
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  name: "Round of 16",
  stage_type: "knockout_stage",
  stage_order: 1,
  status: "active",
};

const UGANDA_CUP_QUARTER_FINALS_ROW: SeedRow = {
  id: SEED_STAGE_IDS.UGANDA_CUP_QUARTER_FINALS,
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  name: "Quarter Finals",
  stage_type: "knockout_stage",
  stage_order: 2,
  status: "active",
};

const UGANDA_CUP_SEMI_FINALS_ROW: SeedRow = {
  id: SEED_STAGE_IDS.UGANDA_CUP_SEMI_FINALS,
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  name: "Semi Finals",
  stage_type: "knockout_stage",
  stage_order: 3,
  status: "active",
};

const UGANDA_CUP_FINAL_ROW: SeedRow = {
  id: SEED_STAGE_IDS.UGANDA_CUP_FINAL,
  competition_id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
  name: "Final",
  stage_type: "one_off_stage",
  stage_order: 4,
  status: "active",
};

const NHL_LEAGUE_SEASON_ROW: SeedRow = {
  id: SEED_STAGE_IDS.NHL_LEAGUE_SEASON,
  competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
  name: "League Season",
  stage_type: "league_stage",
  stage_order: 1,
  status: "active",
};

const UNIVERSITY_ROUND_ROBIN_ROW: SeedRow = {
  id: SEED_STAGE_IDS.UNIVERSITY_ROUND_ROBIN,
  competition_id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
  name: "Round Robin",
  stage_type: "league_stage",
  stage_order: 1,
  status: "active",
};

export function create_seed_competition_stages(): import("$lib/core/types/DomainScalars").ScalarInput<CompetitionStage>[] {
  const now = generate_current_timestamp();

  return [
    { ...EASTER_CUP_POOL_STAGE_ROW },
    { ...EASTER_CUP_SEMI_FINALS_ROW },
    { ...EASTER_CUP_FINAL_ROW },
    { ...UGANDA_CUP_ROUND_OF_16_ROW },
    { ...UGANDA_CUP_QUARTER_FINALS_ROW },
    { ...UGANDA_CUP_SEMI_FINALS_ROW },
    { ...UGANDA_CUP_FINAL_ROW },
    { ...NHL_LEAGUE_SEASON_ROW },
    { ...UNIVERSITY_ROUND_ROBIN_ROW },
  ].map((row) => ({ ...row, created_at: now, updated_at: now }));
}
