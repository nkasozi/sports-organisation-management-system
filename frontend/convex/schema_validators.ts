import { v } from "convex/values";

export const timestamp_fields = {
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
};

export const sync_metadata_fields = {
  id: v.optional(v.string()),
  local_id: v.string(),
  synced_at: v.string(),
  version: v.number(),
};

export const sport_game_period_validator = v.object({
  id: v.string(),
  name: v.string(),
  duration_minutes: v.number(),
  is_break: v.boolean(),
  order: v.number(),
});

export const card_type_validator = v.object({
  id: v.string(),
  name: v.string(),
  color: v.string(),
  severity: v.string(),
  description: v.string(),
  consequences: v.array(v.string()),
});

export const foul_category_validator = v.object({
  id: v.string(),
  name: v.string(),
  severity: v.string(),
  description: v.string(),
  typical_penalty: v.string(),
  results_in_card: v.string(),
});

export const official_requirement_validator = v.object({
  role_id: v.string(),
  role_name: v.string(),
  minimum_count: v.number(),
  maximum_count: v.number(),
  is_mandatory: v.boolean(),
  description: v.string(),
});

const penalties_config_validator = v.object({
  initial_rounds: v.number(),
  sudden_death_after: v.boolean(),
});

export const overtime_rule_validator = v.object({
  is_enabled: v.boolean(),
  trigger_condition: v.string(),
  overtime_type: v.string(),
  extra_time_periods: v.array(sport_game_period_validator),
  penalties_config: penalties_config_validator,
});

export const scoring_rule_validator = v.object({
  event_type: v.string(),
  points_awarded: v.number(),
  description: v.string(),
});

export const substitution_rule_validator = v.object({
  max_substitutions_per_game: v.number(),
  max_substitution_windows: v.number(),
  rolling_substitutions_allowed: v.boolean(),
  return_after_substitution_allowed: v.boolean(),
});

export const game_event_validator = v.object({
  id: v.string(),
  event_type: v.string(),
  minute: v.number(),
  stoppage_time_minute: v.number(),
  team_side: v.string(),
  player_name: v.string(),
  secondary_player_name: v.string(),
  description: v.string(),
  recorded_at: v.string(),
});

export const assigned_official_validator = v.object({
  official_id: v.string(),
  role_id: v.string(),
  role_name: v.string(),
});

export const jersey_color_assignment_validator = v.object({
  jersey_color_id: v.string(),
  main_color: v.string(),
  nickname: v.string(),
});

export const official_assignment_validator = v.object({
  official_id: v.string(),
  role_id: v.string(),
});

export const lineup_player_validator = v.object({
  id: v.string(),
  first_name: v.string(),
  last_name: v.string(),
  jersey_number: v.number(),
  position: v.string(),
  is_captain: v.boolean(),
  is_substitute: v.boolean(),
  time_on: v.optional(v.string()),
});
