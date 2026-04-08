import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
  lineup_player_validator,
  official_assignment_validator,
  sync_metadata_fields,
  timestamp_fields,
} from "./schema_validators";

export const schema_relation_tables = {
  competition_teams: defineTable({
    ...sync_metadata_fields,
    competition_id: v.string(),
    team_id: v.string(),
    registration_date: v.optional(v.string()),
    seed_number: v.optional(v.union(v.number(), v.null())),
    group_name: v.optional(v.union(v.string(), v.null())),
    seed: v.optional(v.union(v.number(), v.null())),
    points: v.optional(v.number()),
    goals_for: v.optional(v.number()),
    goals_against: v.optional(v.number()),
    goal_difference: v.optional(v.number()),
    matches_played: v.optional(v.number()),
    matches_won: v.optional(v.number()),
    matches_drawn: v.optional(v.number()),
    matches_lost: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_competition", ["competition_id"])
    .index("by_team", ["team_id"]),
  player_team_memberships: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    player_id: v.string(),
    team_id: v.string(),
    position_id: v.optional(v.string()),
    jersey_number: v.optional(v.union(v.number(), v.null())),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    is_captain: v.optional(v.boolean()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_player", ["player_id"])
    .index("by_team", ["team_id"]),
  fixture_details_setups: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    fixture_id: v.string(),
    home_team_jersey_id: v.optional(v.string()),
    away_team_jersey_id: v.optional(v.string()),
    official_jersey_id: v.optional(v.string()),
    assigned_officials: v.optional(v.array(official_assignment_validator)),
    assignment_notes: v.optional(v.string()),
    confirmation_status: v.optional(v.string()),
    referee_id: v.optional(v.string()),
    assistant_referee_1_id: v.optional(v.string()),
    assistant_referee_2_id: v.optional(v.string()),
    fourth_official_id: v.optional(v.string()),
    home_jersey_color_id: v.optional(v.string()),
    away_jersey_color_id: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_fixture", ["fixture_id"]),
  fixture_lineups: defineTable({
    ...sync_metadata_fields,
    organization_id: v.optional(v.string()),
    fixture_id: v.string(),
    team_id: v.string(),
    selected_players: v.optional(v.array(lineup_player_validator)),
    player_id: v.optional(v.string()),
    position_id: v.optional(v.string()),
    jersey_number: v.optional(v.union(v.number(), v.null())),
    is_starting: v.optional(v.boolean()),
    is_captain: v.optional(v.boolean()),
    submitted_by: v.optional(v.string()),
    submitted_at: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_fixture", ["fixture_id"])
    .index("by_fixture_team", ["fixture_id", "team_id"]),
  activities: defineTable({
    ...sync_metadata_fields,
    title: v.string(),
    description: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    category_id: v.optional(v.string()),
    category_type: v.optional(v.string()),
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    start_datetime: v.optional(v.string()),
    end_datetime: v.optional(v.string()),
    scheduled_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    is_all_day: v.optional(v.boolean()),
    location: v.optional(v.string()),
    venue_id: v.optional(v.union(v.string(), v.null())),
    team_ids: v.optional(v.array(v.string())),
    competition_id: v.optional(v.union(v.string(), v.null())),
    fixture_id: v.optional(v.union(v.string(), v.null())),
    source_type: v.optional(v.string()),
    source_id: v.optional(v.union(v.string(), v.null())),
    recurrence: v.optional(
      v.union(
        v.object({
          pattern: v.string(),
          interval: v.number(),
          end_date: v.union(v.string(), v.null()),
          days_of_week: v.array(v.number()),
        }),
        v.null(),
      ),
    ),
    reminders: v.optional(
      v.array(
        v.object({
          id: v.string(),
          minutes_before: v.number(),
          is_enabled: v.boolean(),
        }),
      ),
    ),
    color_override: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_scheduled_date", ["scheduled_date"]),
};
