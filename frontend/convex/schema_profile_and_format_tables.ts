import { defineTable } from "convex/server";
import { v } from "convex/values";

import { sync_metadata_fields, timestamp_fields } from "./schema_validators";

export const schema_profile_and_format_tables = {
  player_profiles: defineTable({
    ...sync_metadata_fields,
    player_id: v.string(),
    slug: v.optional(v.string()),
    profile_slug: v.optional(v.string()),
    bio: v.optional(v.string()),
    profile_summary: v.optional(v.string()),
    achievements: v.optional(v.string()),
    featured_image_url: v.optional(v.string()),
    visibility: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_player", ["player_id"]),
  team_profiles: defineTable({
    ...sync_metadata_fields,
    team_id: v.string(),
    slug: v.optional(v.string()),
    profile_slug: v.optional(v.string()),
    bio: v.optional(v.string()),
    profile_summary: v.optional(v.string()),
    achievements: v.optional(v.string()),
    featured_image_url: v.optional(v.string()),
    visibility: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_team", ["team_id"]),
  profile_links: defineTable({
    ...sync_metadata_fields,
    profile_type: v.optional(v.string()),
    profile_id: v.string(),
    platform: v.string(),
    title: v.optional(v.string()),
    url: v.string(),
    display_order: v.optional(v.number()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_profile", ["profile_id"]),
  calendar_tokens: defineTable({
    ...sync_metadata_fields,
    token: v.string(),
    user_id: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    feed_type: v.optional(v.string()),
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    entity_name: v.optional(v.string()),
    reminder_minutes_before: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    last_accessed_at: v.optional(v.string()),
    access_count: v.optional(v.number()),
    expires_at: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_token", ["token"]),
  competition_formats: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    sport_id: v.optional(v.string()),
    description: v.optional(v.string()),
    format_type: v.optional(v.string()),
    tie_breakers: v.optional(v.array(v.string())),
    group_stage_config: v.optional(
      v.object({
        number_of_groups: v.number(),
        teams_per_group: v.number(),
        teams_advancing_per_group: v.number(),
        matches_per_round: v.number(),
      }),
    ),
    knockout_stage_config: v.optional(
      v.object({
        number_of_rounds: v.number(),
        third_place_match: v.boolean(),
        two_legged_ties: v.boolean(),
        away_goals_rule: v.boolean(),
        extra_time_enabled: v.boolean(),
        penalty_shootout_enabled: v.boolean(),
      }),
    ),
    league_config: v.optional(
      v.object({
        number_of_rounds: v.number(),
        points_for_win: v.number(),
        points_for_draw: v.number(),
        points_for_loss: v.number(),
        promotion_spots: v.number(),
        relegation_spots: v.number(),
        playoff_spots: v.number(),
      }),
    ),
    points_config: v.optional(
      v.object({
        points_for_win: v.number(),
        points_for_draw: v.number(),
        points_for_loss: v.number(),
      }),
    ),
    min_teams_required: v.optional(v.number()),
    max_teams_allowed: v.optional(v.number()),
    rules: v.optional(v.string()),
    status: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    stage_templates: v.optional(
      v.array(
        v.object({
          name: v.string(),
          stage_type: v.string(),
          stage_order: v.number(),
        }),
      ),
    ),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_organization", ["organization_id"]),
};
