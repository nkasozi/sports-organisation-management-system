import type { Fixture } from "../../../core/entities/Fixture";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_FIXTURE_IDS,
  SEED_OFFICIAL_IDS,
  SEED_ORGANIZATION_IDS,
  SEED_STAGE_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";

export function create_seed_fixtures_part1(
  referee_role_id: string,
  assistant_referee_role_id: string,
  next_week: Date,
  two_weeks: Date,
  three_weeks: Date,
): Fixture[] {
  const now = generate_current_timestamp();

  return [
    {
      id: SEED_FIXTURE_IDS.FIXTURE_1,
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
      round_number: 1,
      round_name: "Round 1",
      home_team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
      away_team_id: SEED_TEAM_IDS.KAMPALA_HC,
      venue: "Lugogo Hockey Stadium",
      scheduled_date: next_week.toISOString().split("T")[0],
      scheduled_time: "15:00",
      home_team_score: null,
      away_team_score: null,
      assigned_officials: [
        {
          official_id: SEED_OFFICIAL_IDS.MICHAEL_ANDERSON,
          role_id: referee_role_id,
          role_name: "Umpire",
        },
        {
          official_id: SEED_OFFICIAL_IDS.SARAH_JOHNSON,
          role_id: assistant_referee_role_id,
          role_name: "Technical Table",
        },
      ],
      game_events: [],
      current_period: "pre_game",
      current_minute: 0,
      match_day: 1,
      notes: "Season opener - Weatherhead vs Kampala HC derby",
      stage_id: SEED_STAGE_IDS.NHL_LEAGUE_SEASON,
      status: "scheduled",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_FIXTURE_IDS.FIXTURE_2,
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
      round_number: 1,
      round_name: "Round 1",
      home_team_id: SEED_TEAM_IDS.ROCKETS_HC,
      away_team_id: SEED_TEAM_IDS.WANANCHI_HC,
      venue: "Entebbe Sports Club",
      scheduled_date: two_weeks.toISOString().split("T")[0],
      scheduled_time: "16:00",
      home_team_score: null,
      away_team_score: null,
      assigned_officials: [
        {
          official_id: SEED_OFFICIAL_IDS.EMILY_DAVIS,
          role_id: referee_role_id,
          role_name: "Umpire",
        },
        {
          official_id: SEED_OFFICIAL_IDS.JAMES_WILLIAMS,
          role_id: assistant_referee_role_id,
          role_name: "Technical Table",
        },
      ],
      game_events: [],
      current_period: "pre_game",
      current_minute: 0,
      match_day: 1,
      notes: "Rockets vs Wananchi - Battle of the veterans",
      stage_id: SEED_STAGE_IDS.NHL_LEAGUE_SEASON,
      status: "scheduled",
      created_at: now,
      updated_at: now,
    },
  ];
}
