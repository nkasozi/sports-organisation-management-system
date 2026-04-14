import type { CompetitionFormat } from "../../../core/entities/CompetitionFormatTypes";
import type {
  IsoDateTimeString,
  ScalarValueInput,
} from "../../../core/types/DomainScalars";

export const SEED_ORGANIZATION_IDS = {
  UGANDA_HOCKEY_ASSOCIATION: "org_default_1",
};

export const SEED_TEAM_IDS = {
  WEATHERHEAD_HC: "team_default_1",
  KAMPALA_HC: "team_default_2",
  ROCKETS_HC: "team_default_3",
  WANANCHI_HC: "team_default_4",
  MAKERERE_UNIVERSITY_HC: "team_default_5",
  KYAMBOGO_UNIVERSITY_HC: "team_default_6",
  SIMBA_HC: "team_default_7",
  STRIKERS_HC: "team_default_8",
  WEATHERHEAD_HC_WOMEN: "team_default_9",
  KAMPALA_HC_WOMEN: "team_default_10",
  WANANCHI_HC_WOMEN: "team_default_11",
  ROCKETS_HC_WOMEN: "team_default_12",
};

const SEED_COMPETITION_FORMAT_IDS = {
  STANDARD_LEAGUE: "format_standard_league",
  SINGLE_ELIMINATION: "format_single_elimination",
  DOUBLE_ELIMINATION: "format_double_elimination",
  GROUP_STAGE_KNOCKOUT: "format_group_knockout",
};

export const SEED_COMPETITION_IDS = {
  EASTER_CUP_2026: "comp_default_1",
  UGANDA_CUP_2026: "comp_default_2",
  NATIONAL_HOCKEY_LEAGUE_2026: "comp_default_3",
  UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026: "comp_default_4",
};

export const SEED_STAGE_IDS = {
  EASTER_CUP_POOL_STAGE: "stage_default_1",
  EASTER_CUP_SEMI_FINALS: "stage_default_2",
  EASTER_CUP_FINAL: "stage_default_3",
  UGANDA_CUP_ROUND_OF_16: "stage_default_4",
  UGANDA_CUP_QUARTER_FINALS: "stage_default_5",
  UGANDA_CUP_SEMI_FINALS: "stage_default_6",
  UGANDA_CUP_FINAL: "stage_default_7",
  NHL_LEAGUE_SEASON: "stage_default_8",
  UNIVERSITY_ROUND_ROBIN: "stage_default_9",
};

export interface SeedCompetitionFormatIds {
  easter_cup_format_id: ScalarValueInput<CompetitionFormat["id"]>;
  uganda_cup_format_id: ScalarValueInput<CompetitionFormat["id"]>;
  nhl_format_id: ScalarValueInput<CompetitionFormat["id"]>;
  university_format_id: ScalarValueInput<CompetitionFormat["id"]>;
}

export const SEED_STAFF_IDS = {
  HEAD_COACH_1: "staff_default_1",
  ASSISTANT_COACH_1: "staff_default_2",
  HEAD_COACH_2: "staff_default_3",
  PHYSIO_1: "staff_default_4",
  MANAGER_1: "staff_default_5",
};

export const SEED_OFFICIAL_IDS = {
  MICHAEL_ANDERSON: "official_default_1",
  SARAH_JOHNSON: "official_default_2",
  JAMES_WILLIAMS: "official_default_3",
  EMILY_DAVIS: "official_default_4",
};

export const SEED_FIXTURE_IDS = {
  FIXTURE_1: "fixture_default_1",
  FIXTURE_2: "fixture_default_2",
  EASTER_CUP_GROUP_A_1: "fixture_default_3",
  HOCKEY_FIXTURE_1: "fixture_default_4",
  COMPLETED_HOCKEY_GAME: "fixture_default_5",
  COMPLETED_GAME_2: "fixture_default_6",
  EASTER_CUP_GROUP_B_1: "fixture_default_7",
  EASTER_CUP_GROUP_A_2: "fixture_default_8",
  EASTER_CUP_GROUP_A_3: "fixture_default_9",
  EASTER_CUP_GROUP_B_2: "fixture_default_10",
  EASTER_CUP_GROUP_B_3: "fixture_default_11",
  EASTER_CUP_SEMI_1: "fixture_default_12",
  EASTER_CUP_SEMI_2: "fixture_default_13",
  EASTER_CUP_FINAL: "fixture_default_14",
};

export const SEED_FIXTURE_LINEUP_IDS = {
  COMPLETED_GAME_HOME_LINEUP: "lineup_default_1",
  COMPLETED_GAME_AWAY_LINEUP: "lineup_default_2",
  COMPLETED_GAME_2_HOME_LINEUP: "lineup_default_3",
  COMPLETED_GAME_2_AWAY_LINEUP: "lineup_default_4",
  COMPLETED_GAME_3_HOME_LINEUP: "lineup_default_5",
  COMPLETED_GAME_3_AWAY_LINEUP: "lineup_default_6",
  EASTER_CUP_GROUP_A_1_HOME_LINEUP: "lineup_default_7",
  EASTER_CUP_GROUP_A_1_AWAY_LINEUP: "lineup_default_8",
  EASTER_CUP_GROUP_A_2_HOME_LINEUP: "lineup_default_9",
  EASTER_CUP_GROUP_A_2_AWAY_LINEUP: "lineup_default_10",
  EASTER_CUP_GROUP_A_3_HOME_LINEUP: "lineup_default_11",
  EASTER_CUP_GROUP_A_3_AWAY_LINEUP: "lineup_default_12",
  EASTER_CUP_GROUP_B_2_HOME_LINEUP: "lineup_default_13",
  EASTER_CUP_GROUP_B_2_AWAY_LINEUP: "lineup_default_14",
  EASTER_CUP_GROUP_B_3_HOME_LINEUP: "lineup_default_15",
  EASTER_CUP_GROUP_B_3_AWAY_LINEUP: "lineup_default_16",
  EASTER_CUP_SEMI_1_HOME_LINEUP: "lineup_default_17",
  EASTER_CUP_SEMI_1_AWAY_LINEUP: "lineup_default_18",
  EASTER_CUP_SEMI_2_HOME_LINEUP: "lineup_default_19",
  EASTER_CUP_SEMI_2_AWAY_LINEUP: "lineup_default_20",
  EASTER_CUP_FINAL_HOME_LINEUP: "lineup_default_21",
  EASTER_CUP_FINAL_AWAY_LINEUP: "lineup_default_22",
};

export const SEED_VENUE_IDS = {
  LUGOGO_HOCKEY_STADIUM: "venue_default_1",
  KYAMBOGO_HOCKEY_PITCH: "venue_default_2",
  MAKERERE_HOCKEY_GROUND: "venue_default_3",
  ENTEBBE_SPORTS_CLUB: "venue_default_4",
  JINJA_HOCKEY_GROUND: "venue_default_5",
};

export const SEED_JERSEY_COLOR_IDS = {
  WEATHERHEAD_HOME: "jersey_default_1",
  WEATHERHEAD_AWAY: "jersey_default_2",
  KAMPALA_HC_HOME: "jersey_default_3",
  KAMPALA_HC_AWAY: "jersey_default_4",
  ROCKETS_HOME: "jersey_default_5",
  ROCKETS_AWAY: "jersey_default_6",
  EASTER_CUP_OFFICIAL_BLACK: "jersey_default_7",
  EASTER_CUP_OFFICIAL_YELLOW: "jersey_default_8",
  UGANDA_CUP_OFFICIAL_BLACK: "jersey_default_9",
  UGANDA_CUP_OFFICIAL_GREEN: "jersey_default_10",
  NHL_OFFICIAL_GRAY: "jersey_default_11",
  NHL_OFFICIAL_NAVY: "jersey_default_12",
  UNIVERSITY_OFFICIAL_WHITE: "jersey_default_13",
  UNIVERSITY_OFFICIAL_ORANGE: "jersey_default_14",
  WANANCHI_HOME: "jersey_default_15",
  WANANCHI_AWAY: "jersey_default_16",
  MAKERERE_HOME: "jersey_default_17",
  MAKERERE_AWAY: "jersey_default_18",
  KYAMBOGO_HOME: "jersey_default_19",
  KYAMBOGO_AWAY: "jersey_default_20",
  SIMBA_HOME: "jersey_default_21",
  SIMBA_AWAY: "jersey_default_22",
  STRIKERS_HOME: "jersey_default_23",
  STRIKERS_AWAY: "jersey_default_24",
};

export const SEED_PLAYER_PROFILE_IDS = {
  DENIS_ONYANGO_PROFILE: "profile_default_1",
  BRIAN_SSALI_PROFILE: "profile_default_2",
  SARAH_NAMUGWANYA_PROFILE: "profile_default_3",
};

export const SEED_TEAM_PROFILE_IDS = {
  WEATHERHEAD_HC_PROFILE: "team_profile_default_1",
  KAMPALA_HC_PROFILE: "team_profile_default_2",
  ROCKETS_HC_PROFILE: "team_profile_default_3",
  WANANCHI_HC_PROFILE: "team_profile_default_4",
  MAKERERE_UNIVERSITY_PROFILE: "team_profile_default_5",
  KYAMBOGO_UNIVERSITY_PROFILE: "team_profile_default_6",
  SIMBA_HC_PROFILE: "team_profile_default_7",
  STRIKERS_HC_PROFILE: "team_profile_default_8",
};

export const SEED_SYSTEM_USER_IDS = {
  SYSTEM_ADMINISTRATOR: "system_user_default_1",
  ORG_ADMIN_UGANDA_HOCKEY: "system_user_default_2",
  OFFICIALS_MANAGER_UGANDA_HOCKEY: "system_user_default_3",
  TEAM_MANAGER_WEATHERHEAD: "system_user_default_4",
  OFFICIAL_MICHAEL_ANDERSON: "system_user_default_5",
  PLAYER_DENIS_ONYANGO: "system_user_default_6",
};

const SEED_IDENTIFICATION_TYPE_IDS = {
  NATIONAL_ID: `id_type_default_1_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
  PASSPORT: `id_type_default_2_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
  DRIVING_LICENSE: `id_type_default_3_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
  PLAYER_REGISTRATION_NUMBER: `id_type_default_4_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
  FEDERATION_ID: `id_type_default_5_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
};

export const SEED_GENDER_IDS = {
  MALE: `gender_default_male_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
  FEMALE: `gender_default_female_${SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION}`,
};

export function generate_current_timestamp(): IsoDateTimeString {
  return new Date().toISOString() as IsoDateTimeString;
}
