import type { JerseyColor } from "../../../core/entities/JerseyColor";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_JERSEY_COLOR_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<JerseyColor>,
  "created_at" | "updated_at"
>;

const UNIVERSITY_OFFICIAL_WHITE_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.UNIVERSITY_OFFICIAL_WHITE,
  holder_type: "competition_official",
  holder_id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
  nickname: "Standard White",
  main_color: "#FFFFFF",
  secondary_color: "#1F2937",
  tertiary_color: "#16A34A",
  status: "active",
};

const UNIVERSITY_OFFICIAL_ORANGE_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.UNIVERSITY_OFFICIAL_ORANGE,
  holder_type: "competition_official",
  holder_id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
  nickname: "Alternate Orange",
  main_color: "#EA580C",
  secondary_color: "#1F2937",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const WANANCHI_HOME_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.WANANCHI_HOME,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.WANANCHI_HC,
  nickname: "Home Kit",
  main_color: "#16A34A",
  secondary_color: "#FFFFFF",
  tertiary_color: "#1F2937",
  status: "active",
};

const WANANCHI_AWAY_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.WANANCHI_AWAY,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.WANANCHI_HC,
  nickname: "Away Kit",
  main_color: "#FFFFFF",
  secondary_color: "#16A34A",
  tertiary_color: "#1F2937",
  status: "active",
};

const MAKERERE_HOME_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.MAKERERE_HOME,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  nickname: "Home Kit",
  main_color: "#7C3AED",
  secondary_color: "#F3E8FF",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const MAKERERE_AWAY_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.MAKERERE_AWAY,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
  nickname: "Away Kit",
  main_color: "#F3E8FF",
  secondary_color: "#7C3AED",
  tertiary_color: "#1F2937",
  status: "active",
};

const KYAMBOGO_HOME_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.KYAMBOGO_HOME,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
  nickname: "Home Kit",
  main_color: "#0891B2",
  secondary_color: "#ECFEFF",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const KYAMBOGO_AWAY_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.KYAMBOGO_AWAY,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
  nickname: "Away Kit",
  main_color: "#ECFEFF",
  secondary_color: "#0891B2",
  tertiary_color: "#1F2937",
  status: "active",
};

const SIMBA_HOME_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.SIMBA_HOME,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.SIMBA_HC,
  nickname: "Home Kit",
  main_color: "#EA580C",
  secondary_color: "#1F2937",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const SIMBA_AWAY_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.SIMBA_AWAY,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.SIMBA_HC,
  nickname: "Away Kit",
  main_color: "#1F2937",
  secondary_color: "#EA580C",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const STRIKERS_HOME_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.STRIKERS_HOME,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.STRIKERS_HC,
  nickname: "Home Kit",
  main_color: "#DB2777",
  secondary_color: "#FDF2F8",
  tertiary_color: "#FFFFFF",
  status: "active",
};

const STRIKERS_AWAY_ROW: SeedRow = {
  id: SEED_JERSEY_COLOR_IDS.STRIKERS_AWAY,
  holder_type: "team",
  holder_id: SEED_TEAM_IDS.STRIKERS_HC,
  nickname: "Away Kit",
  main_color: "#FDF2F8",
  secondary_color: "#DB2777",
  tertiary_color: "#1F2937",
  status: "active",
};

export function create_seed_jersey_colors_part2(): import("$lib/core/types/DomainScalars").ScalarInput<JerseyColor>[] {
  const now = generate_current_timestamp();

  return [
    { ...UNIVERSITY_OFFICIAL_WHITE_ROW },
    { ...UNIVERSITY_OFFICIAL_ORANGE_ROW },
    { ...WANANCHI_HOME_ROW },
    { ...WANANCHI_AWAY_ROW },
    { ...MAKERERE_HOME_ROW },
    { ...MAKERERE_AWAY_ROW },
    { ...KYAMBOGO_HOME_ROW },
    { ...KYAMBOGO_AWAY_ROW },
    { ...SIMBA_HOME_ROW },
    { ...SIMBA_AWAY_ROW },
    { ...STRIKERS_HOME_ROW },
    { ...STRIKERS_AWAY_ROW },
  ].map((row) => ({ ...row, created_at: now, updated_at: now }));
}
