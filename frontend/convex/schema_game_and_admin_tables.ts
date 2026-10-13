import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
  ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
  ORGANIZATION_LOCAL_ID_INDEX_NAME,
  sync_metadata_fields,
  timestamp_fields,
} from "./schema_validators";

export const schema_game_and_admin_tables = {
  live_game_logs: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    fixture_id: v.string(),
    home_lineup_id: v.optional(v.string()),
    away_lineup_id: v.optional(v.string()),
    current_period: v.optional(v.string()),
    current_minute: v.optional(v.number()),
    stoppage_time_minutes: v.optional(v.number()),
    clock_running: v.optional(v.boolean()),
    clock_paused_at_seconds: v.optional(v.number()),
    home_team_score: v.optional(v.number()),
    away_team_score: v.optional(v.number()),
    game_status: v.optional(v.string()),
    started_at: v.optional(v.string()),
    ended_at: v.optional(v.string()),
    started_by_user_id: v.optional(v.string()),
    ended_by_user_id: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index(ORGANIZATION_LOCAL_ID_INDEX_NAME, [
      ...ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
    ])
    .index("by_fixture", ["fixture_id"]),
  game_event_logs: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    live_game_log_id: v.optional(v.string()),
    fixture_id: v.string(),
    event_type: v.string(),
    minute: v.optional(v.number()),
    stoppage_time_minute: v.optional(v.number()),
    team_side: v.optional(v.string()),
    player_id: v.optional(v.string()),
    player_name: v.optional(v.string()),
    secondary_player_id: v.optional(v.string()),
    secondary_player_name: v.optional(v.string()),
    description: v.optional(v.string()),
    affects_score: v.optional(v.boolean()),
    score_change_home: v.optional(v.number()),
    score_change_away: v.optional(v.number()),
    recorded_by_user_id: v.optional(v.string()),
    recorded_at: v.optional(v.string()),
    reviewed: v.optional(v.boolean()),
    reviewed_by_user_id: v.optional(v.string()),
    reviewed_at: v.optional(v.string()),
    voided: v.optional(v.boolean()),
    voided_reason: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index(ORGANIZATION_LOCAL_ID_INDEX_NAME, [
      ...ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
    ])
    .index("by_fixture", ["fixture_id"])
    .index("by_live_game_log", ["live_game_log_id"]),
  player_team_transfer_histories: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    player_id: v.string(),
    from_team_id: v.optional(v.string()),
    to_team_id: v.optional(v.string()),
    transfer_date: v.optional(v.string()),
    approved_by: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index(ORGANIZATION_LOCAL_ID_INDEX_NAME, [
      ...ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
    ])
    .index("by_player", ["player_id"]),
  official_associated_teams: defineTable({
    ...sync_metadata_fields,
    official_id: v.string(),
    team_id: v.string(),
    association_type: v.optional(v.string()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index("by_official", ["official_id"])
    .index("by_team", ["team_id"]),
  official_performance_ratings: defineTable({
    ...sync_metadata_fields,
    organization_id: v.string(),
    official_id: v.string(),
    fixture_id: v.string(),
    rater_user_id: v.string(),
    rater_role: v.string(),
    overall: v.number(),
    decision_accuracy: v.number(),
    game_control: v.number(),
    communication: v.number(),
    fitness: v.number(),
    notes: v.optional(v.string()),
    submitted_at: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index(ORGANIZATION_LOCAL_ID_INDEX_NAME, [
      ...ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
    ])
    .index("by_official", ["official_id"])
    .index("by_fixture", ["fixture_id"])
    .index("by_rater", ["rater_user_id"])
    .index("by_official_fixture_rater", [
      "official_id",
      "fixture_id",
      "rater_user_id",
    ]),
};
