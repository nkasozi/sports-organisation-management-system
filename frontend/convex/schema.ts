import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamp_fields = {
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
};

const sync_metadata_fields = {
  id: v.optional(v.string()),
  local_id: v.string(),
  synced_at: v.string(),
  version: v.number(),
};

const sport_game_period_validator = v.object({
  id: v.string(),
  name: v.string(),
  duration_minutes: v.number(),
  is_break: v.boolean(),
  order: v.number(),
});

const card_type_validator = v.object({
  id: v.string(),
  name: v.string(),
  color: v.string(),
  severity: v.string(),
  description: v.string(),
  consequences: v.array(v.string()),
});

const foul_category_validator = v.object({
  id: v.string(),
  name: v.string(),
  severity: v.string(),
  description: v.string(),
  typical_penalty: v.string(),
  results_in_card: v.union(v.string(), v.null()),
});

const official_requirement_validator = v.object({
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

const overtime_rule_validator = v.object({
  is_enabled: v.boolean(),
  trigger_condition: v.string(),
  overtime_type: v.string(),
  extra_time_periods: v.array(sport_game_period_validator),
  penalties_config: v.union(penalties_config_validator, v.null()),
});

const scoring_rule_validator = v.object({
  event_type: v.string(),
  points_awarded: v.number(),
  description: v.string(),
});

const substitution_rule_validator = v.object({
  max_substitutions_per_game: v.number(),
  max_substitution_windows: v.union(v.number(), v.null()),
  rolling_substitutions_allowed: v.boolean(),
  return_after_substitution_allowed: v.boolean(),
});

const game_event_validator = v.object({
  id: v.string(),
  event_type: v.string(),
  minute: v.number(),
  stoppage_time_minute: v.union(v.number(), v.null()),
  team_side: v.string(),
  player_name: v.string(),
  secondary_player_name: v.string(),
  description: v.string(),
  recorded_at: v.string(),
});

const assigned_official_validator = v.object({
  official_id: v.string(),
  role_id: v.string(),
  role_name: v.string(),
});

const jersey_color_assignment_validator = v.object({
  jersey_color_id: v.string(),
  main_color: v.string(),
  nickname: v.string(),
});

const official_assignment_validator = v.object({
  official_id: v.string(),
  role_id: v.string(),
});

const lineup_player_validator = v.object({
  id: v.string(),
  first_name: v.string(),
  last_name: v.string(),
  jersey_number: v.union(v.number(), v.null()),
  position: v.union(v.string(), v.null()),
  is_captain: v.boolean(),
  is_substitute: v.boolean(),
});

export default defineSchema({
  organizations: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    description: v.optional(v.string()),
    sport_id: v.string(),
    logo_url: v.optional(v.string()),
    website: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    address: v.optional(v.string()),
    founded_date: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  competitions: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    description: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    competition_format_id: v.optional(v.string()),
    format_id: v.optional(v.string()),
    team_ids: v.optional(v.array(v.string())),
    allow_auto_squad_submission: v.optional(v.boolean()),
    squad_generation_strategy: v.optional(v.string()),
    allow_auto_fixture_details_setup: v.optional(v.boolean()),
    lineup_submission_deadline_hours: v.optional(v.number()),
    season: v.optional(v.string()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    registration_deadline: v.optional(v.string()),
    max_teams: v.optional(v.number()),
    entry_fee: v.optional(v.number()),
    prize_pool: v.optional(v.number()),
    location: v.optional(v.string()),
    rule_overrides: v.optional(
      v.object({
        game_duration_minutes: v.optional(v.number()),
        periods: v.optional(v.array(sport_game_period_validator)),
        additional_card_types: v.optional(v.array(card_type_validator)),
        additional_foul_categories: v.optional(
          v.array(foul_category_validator),
        ),
        official_requirements: v.optional(
          v.array(official_requirement_validator),
        ),
        overtime_rules: v.optional(overtime_rule_validator),
        scoring_rules: v.optional(v.array(scoring_rule_validator)),
        substitution_rules: v.optional(substitution_rule_validator),
        max_players_on_field: v.optional(v.number()),
        min_players_on_field: v.optional(v.number()),
        max_squad_size: v.optional(v.number()),
        custom_rules: v.optional(v.record(v.string(), v.string())),
      }),
    ),
    status: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  teams: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    short_name: v.optional(v.string()),
    description: v.optional(v.string()),
    organization_id: v.string(),
    captain_player_id: v.optional(v.union(v.string(), v.null())),
    vice_captain_player_id: v.optional(v.union(v.string(), v.null())),
    max_squad_size: v.optional(v.number()),
    logo_url: v.optional(v.string()),
    primary_color: v.optional(v.string()),
    secondary_color: v.optional(v.string()),
    home_venue_id: v.optional(v.string()),
    website: v.optional(v.string()),
    founded_year: v.optional(v.number()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_organization", ["organization_id"]),

  players: defineTable({
    ...sync_metadata_fields,
    first_name: v.string(),
    last_name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    position_id: v.optional(v.string()),
    nationality: v.optional(v.string()),
    height_cm: v.optional(v.union(v.number(), v.null())),
    weight_kg: v.optional(v.union(v.number(), v.null())),
    profile_image_url: v.optional(v.string()),
    emergency_contact_name: v.optional(v.string()),
    emergency_contact_phone: v.optional(v.string()),
    medical_notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_email", ["email"]),

  officials: defineTable({
    ...sync_metadata_fields,
    first_name: v.string(),
    last_name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    years_of_experience: v.optional(v.number()),
    nationality: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
    emergency_contact_name: v.optional(v.string()),
    emergency_contact_phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_email", ["email"]),

  fixtures: defineTable({
    ...sync_metadata_fields,
    competition_id: v.optional(v.string()),
    round_number: v.optional(v.union(v.number(), v.null())),
    round_name: v.optional(v.string()),
    home_team_id: v.optional(v.string()),
    away_team_id: v.optional(v.string()),
    venue_id: v.optional(v.string()),
    venue: v.optional(v.string()),
    scheduled_date: v.optional(v.string()),
    scheduled_time: v.optional(v.string()),
    actual_start_time: v.optional(v.string()),
    actual_end_time: v.optional(v.string()),
    home_score: v.optional(v.union(v.number(), v.null())),
    away_score: v.optional(v.union(v.number(), v.null())),
    home_team_score: v.optional(v.union(v.number(), v.null())),
    away_team_score: v.optional(v.union(v.number(), v.null())),
    assigned_officials: v.optional(v.array(assigned_official_validator)),
    game_events: v.optional(v.array(game_event_validator)),
    current_period: v.optional(v.string()),
    current_minute: v.optional(v.union(v.number(), v.null())),
    match_day: v.optional(v.union(v.number(), v.null())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    round: v.optional(v.string()),
    home_team_name: v.optional(v.string()),
    away_team_name: v.optional(v.string()),
    home_team_jersey: v.optional(jersey_color_assignment_validator),
    away_team_jersey: v.optional(jersey_color_assignment_validator),
    officials_jersey: v.optional(jersey_color_assignment_validator),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  sports: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    icon_url: v.optional(v.string()),
    standard_game_duration_minutes: v.optional(v.number()),
    periods: v.optional(v.array(sport_game_period_validator)),
    card_types: v.optional(v.array(card_type_validator)),
    foul_categories: v.optional(v.array(foul_category_validator)),
    official_requirements: v.optional(v.array(official_requirement_validator)),
    overtime_rules: v.optional(overtime_rule_validator),
    scoring_rules: v.optional(v.array(scoring_rule_validator)),
    substitution_rules: v.optional(substitution_rule_validator),
    max_players_on_field: v.optional(v.number()),
    min_players_on_field: v.optional(v.number()),
    max_squad_size: v.optional(v.number()),
    min_players_per_fixture: v.optional(v.number()),
    max_players_per_fixture: v.optional(v.number()),
    max_players_per_team: v.optional(v.number()),
    min_players_per_team: v.optional(v.number()),
    game_duration_minutes: v.optional(v.number()),
    period_duration_minutes: v.optional(v.number()),
    additional_rules: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
    rule_overrides: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  team_staff: defineTable({
    ...sync_metadata_fields,
    team_id: v.string(),
    role_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    photo_url: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    nationality: v.optional(v.string()),
    emergency_contact_name: v.optional(v.string()),
    emergency_contact_phone: v.optional(v.string()),
    employment_start_date: v.optional(v.string()),
    employment_end_date: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_team", ["team_id"]),

  team_staff_roles: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    sport_id: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    is_primary_contact: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  game_official_roles: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    sport_id: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.string()),
    is_required: v.optional(v.boolean()),
    is_on_field: v.optional(v.boolean()),
    is_head_official: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
    display_order: v.optional(v.number()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  venues: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    short_name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    capacity: v.optional(v.number()),
    surface_type: v.optional(v.string()),
    has_lighting: v.optional(v.boolean()),
    has_parking: v.optional(v.boolean()),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    website: v.optional(v.string()),
    image_url: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    photo_url: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  jersey_colors: defineTable({
    ...sync_metadata_fields,
    holder_type: v.optional(v.string()),
    holder_id: v.optional(v.string()),
    nickname: v.optional(v.string()),
    main_color: v.optional(v.string()),
    secondary_color: v.optional(v.string()),
    tertiary_color: v.optional(v.string()),
    name: v.optional(v.string()),
    hex_code: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  player_positions: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    category: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    sport_id: v.optional(v.union(v.string(), v.null())),
    sport_type: v.optional(v.string()),
    description: v.optional(v.string()),
    display_order: v.optional(v.number()),
    is_available: v.optional(v.boolean()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

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
    entity_type: v.string(),
    entity_id: v.string(),
    expires_at: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_token", ["token"]),

  competition_formats: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    sport_id: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.string()),
    format_type: v.optional(v.string()),
    tie_breakers: v.optional(v.array(v.string())),
    group_stage_config: v.optional(
      v.union(
        v.object({
          number_of_groups: v.number(),
          teams_per_group: v.number(),
          teams_advancing_per_group: v.number(),
          matches_per_round: v.number(),
        }),
        v.null(),
      ),
    ),
    knockout_stage_config: v.optional(
      v.union(
        v.object({
          number_of_rounds: v.number(),
          third_place_match: v.boolean(),
          two_legged_ties: v.boolean(),
          away_goals_rule: v.boolean(),
          extra_time_enabled: v.boolean(),
          penalty_shootout_enabled: v.boolean(),
        }),
        v.null(),
      ),
    ),
    league_config: v.optional(
      v.union(
        v.object({
          number_of_rounds: v.number(),
          points_for_win: v.number(),
          points_for_draw: v.number(),
          points_for_loss: v.number(),
          promotion_spots: v.number(),
          relegation_spots: v.number(),
          playoff_spots: v.number(),
        }),
        v.null(),
      ),
    ),
    min_teams_required: v.optional(v.number()),
    max_teams_allowed: v.optional(v.number()),
    rules: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

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
    category_id: v.string(),
    entity_type: v.string(),
    entity_id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    scheduled_date: v.string(),
    end_date: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.string(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_scheduled_date", ["scheduled_date"]),

  activity_categories: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  audit_logs: defineTable({
    ...sync_metadata_fields,
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.string(),
    entity_display_name: v.optional(v.string()),
    user_id: v.optional(v.string()),
    user_email: v.optional(v.string()),
    user_display_name: v.optional(v.string()),
    changes: v.optional(
      v.array(
        v.object({
          field_name: v.string(),
          old_value: v.string(),
          new_value: v.string(),
        }),
      ),
    ),
    timestamp: v.optional(v.string()),
    old_values: v.optional(v.string()),
    new_values: v.optional(v.string()),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_entity", ["entity_type", "entity_id"]),

  system_users: defineTable({
    ...sync_metadata_fields,
    email: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    profile_picture_base64: v.optional(v.string()),
    status: v.optional(v.string()),
    last_login_at: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  identification_types: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    country: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  identifications: defineTable({
    ...sync_metadata_fields,
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    identification_type_id: v.optional(v.string()),
    identification_number: v.optional(v.string()),
    issue_date: v.optional(v.string()),
    expiry_date: v.optional(v.string()),
    document_url: v.optional(v.string()),
    is_verified: v.optional(v.boolean()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  qualifications: defineTable({
    ...sync_metadata_fields,
    holder_type: v.optional(v.string()),
    holder_id: v.optional(v.string()),
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    name: v.optional(v.string()),
    certification_name: v.optional(v.string()),
    certification_level: v.optional(v.string()),
    certification_number: v.optional(v.string()),
    issuing_authority: v.optional(v.string()),
    issuing_body: v.optional(v.string()),
    issue_date: v.optional(v.string()),
    expiry_date: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    document_url: v.optional(v.string()),
    is_verified: v.optional(v.boolean()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  game_event_types: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.optional(v.string()),
    sport_id: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    affects_score: v.optional(v.boolean()),
    requires_player: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
    score_value: v.optional(v.number()),
    status: v.optional(v.string()),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  sync_metadata: defineTable({
    table_name: v.string(),
    last_sync_at: v.string(),
    sync_status: v.string(),
    error_message: v.optional(v.string()),
    records_synced: v.number(),
  }).index("by_table", ["table_name"]),
});
