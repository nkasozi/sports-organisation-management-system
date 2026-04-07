import type { Fixture } from "../../../core/entities/Fixture";
import { GAME_EVENTS_EASTER_CUP_GROUP_B_1 } from "./seedFixtureEvents5";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_FIXTURE_IDS,
  SEED_OFFICIAL_IDS,
  SEED_ORGANIZATION_IDS,
  SEED_STAGE_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";

export function create_seed_fixtures_part5(
  referee_role_id: string,
  assistant_referee_role_id: string,
  next_week: Date,
  two_weeks: Date,
  three_weeks: Date,
): Fixture[] {
  const now = generate_current_timestamp();

  return [
    {
      id: SEED_FIXTURE_IDS.EASTER_CUP_GROUP_B_1,
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_id: SEED_COMPETITION_IDS.EASTER_CUP_2026,
      round_number: 1,
      round_name: "Group Stage",
      home_team_id: SEED_TEAM_IDS.ROCKETS_HC,
      away_team_id: SEED_TEAM_IDS.WANANCHI_HC,
      venue: "Kyambogo Hockey Pitch",
      scheduled_date: "2025-03-28",
      scheduled_time: "14:00",
      home_team_score: 4,
      away_team_score: 2,
      assigned_officials: [
        {
          official_id: SEED_OFFICIAL_IDS.MICHAEL_ANDERSON,
          role_id: referee_role_id,
          role_name: "Umpire",
        },
        {
          official_id: SEED_OFFICIAL_IDS.JAMES_WILLIAMS,
          role_id: referee_role_id,
          role_name: "Umpire",
        },
        {
          official_id: SEED_OFFICIAL_IDS.SARAH_JOHNSON,
          role_id: assistant_referee_role_id,
          role_name: "Technical Table",
        },
      ],
      game_events: GAME_EVENTS_EASTER_CUP_GROUP_B_1,
      current_period: "finished",
      current_minute: 70,
      match_day: 1,
      notes: "Easter Cup - Rockets dominate 10-man Wananchi 4-2",
      stage_id: SEED_STAGE_IDS.EASTER_CUP_POOL_STAGE,
      status: "completed",
      created_at: now,
      updated_at: now,
    },
  ];
}
