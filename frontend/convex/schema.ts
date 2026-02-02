import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamp_fields = {
  created_at: v.string(),
  updated_at: v.optional(v.string()),
};

const sync_metadata_fields = {
  local_id: v.string(),
  synced_at: v.string(),
  version: v.number(),
};

export default defineSchema({
  organizations: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    description: v.optional(v.string()),
    sport_id: v.string(),
    logo_url: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  competitions: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    description: v.optional(v.string()),
    organization_id: v.string(),
    format_id: v.optional(v.string()),
    season: v.optional(v.string()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    status: v.string(),
    logo_url: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_organization", ["organization_id"]),

  teams: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    short_name: v.optional(v.string()),
    organization_id: v.string(),
    logo_url: v.optional(v.string()),
    primary_color: v.optional(v.string()),
    secondary_color: v.optional(v.string()),
    home_venue_id: v.optional(v.string()),
    founded_year: v.optional(v.number()),
    is_active: v.boolean(),
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
    nationality: v.optional(v.string()),
    height_cm: v.optional(v.number()),
    weight_kg: v.optional(v.number()),
    photo_url: v.optional(v.string()),
    is_active: v.boolean(),
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
    role_id: v.optional(v.string()),
    license_number: v.optional(v.string()),
    nationality: v.optional(v.string()),
    photo_url: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_email", ["email"]),

  fixtures: defineTable({
    ...sync_metadata_fields,
    competition_id: v.string(),
    home_team_id: v.string(),
    away_team_id: v.string(),
    venue_id: v.optional(v.string()),
    venue: v.optional(v.string()),
    scheduled_date: v.string(),
    actual_start_time: v.optional(v.string()),
    actual_end_time: v.optional(v.string()),
    home_score: v.optional(v.number()),
    away_score: v.optional(v.number()),
    status: v.string(),
    round: v.optional(v.string()),
    match_day: v.optional(v.number()),
    notes: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_competition", ["competition_id"])
    .index("by_scheduled_date", ["scheduled_date"]),

  sports: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    max_players_per_team: v.optional(v.number()),
    min_players_per_team: v.optional(v.number()),
    game_duration_minutes: v.optional(v.number()),
    periods: v.optional(v.number()),
    period_duration_minutes: v.optional(v.number()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  team_staff: defineTable({
    ...sync_metadata_fields,
    team_id: v.string(),
    role_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    photo_url: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_team", ["team_id"]),

  team_staff_roles: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    sport_id: v.optional(v.string()),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  game_official_roles: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    sport_id: v.optional(v.string()),
    description: v.optional(v.string()),
    is_required: v.boolean(),
    sort_order: v.optional(v.number()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  venues: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    capacity: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    photo_url: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  jersey_colors: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    hex_code: v.string(),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  player_positions: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    abbreviation: v.string(),
    sport_id: v.string(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sport", ["sport_id"]),

  player_profiles: defineTable({
    ...sync_metadata_fields,
    player_id: v.string(),
    slug: v.string(),
    bio: v.optional(v.string()),
    achievements: v.optional(v.string()),
    is_public: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_player", ["player_id"])
    .index("by_slug", ["slug"]),

  team_profiles: defineTable({
    ...sync_metadata_fields,
    team_id: v.string(),
    slug: v.string(),
    bio: v.optional(v.string()),
    achievements: v.optional(v.string()),
    is_public: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_team", ["team_id"])
    .index("by_slug", ["slug"]),

  profile_links: defineTable({
    ...sync_metadata_fields,
    profile_type: v.string(),
    profile_id: v.string(),
    platform: v.string(),
    url: v.string(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_profile", ["profile_type", "profile_id"]),

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
    sport_id: v.optional(v.string()),
    description: v.optional(v.string()),
    rules: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  competition_teams: defineTable({
    ...sync_metadata_fields,
    competition_id: v.string(),
    team_id: v.string(),
    group_name: v.optional(v.string()),
    seed: v.optional(v.number()),
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
    jersey_number: v.optional(v.number()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    is_captain: v.boolean(),
    is_active: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_player", ["player_id"])
    .index("by_team", ["team_id"]),

  fixture_details_setups: defineTable({
    ...sync_metadata_fields,
    fixture_id: v.string(),
    referee_id: v.optional(v.string()),
    assistant_referee_1_id: v.optional(v.string()),
    assistant_referee_2_id: v.optional(v.string()),
    fourth_official_id: v.optional(v.string()),
    home_jersey_color_id: v.optional(v.string()),
    away_jersey_color_id: v.optional(v.string()),
    notes: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_fixture", ["fixture_id"]),

  fixture_lineups: defineTable({
    ...sync_metadata_fields,
    fixture_id: v.string(),
    team_id: v.string(),
    player_id: v.string(),
    position_id: v.optional(v.string()),
    jersey_number: v.optional(v.number()),
    is_starting: v.boolean(),
    is_captain: v.boolean(),
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
    color: v.string(),
    icon: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  audit_logs: defineTable({
    ...sync_metadata_fields,
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.string(),
    user_id: v.optional(v.string()),
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
    email: v.string(),
    name: v.optional(v.string()),
    role: v.string(),
    avatar_url: v.optional(v.string()),
    is_active: v.boolean(),
    last_login_at: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_email", ["email"]),

  identification_types: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    country: v.optional(v.string()),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    ...timestamp_fields,
  }).index("by_local_id", ["local_id"]),

  identifications: defineTable({
    ...sync_metadata_fields,
    entity_type: v.string(),
    entity_id: v.string(),
    identification_type_id: v.string(),
    identification_number: v.string(),
    issue_date: v.optional(v.string()),
    expiry_date: v.optional(v.string()),
    document_url: v.optional(v.string()),
    is_verified: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_entity", ["entity_type", "entity_id"]),

  qualifications: defineTable({
    ...sync_metadata_fields,
    entity_type: v.string(),
    entity_id: v.string(),
    name: v.string(),
    issuing_body: v.optional(v.string()),
    issue_date: v.optional(v.string()),
    expiry_date: v.optional(v.string()),
    document_url: v.optional(v.string()),
    is_verified: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_entity", ["entity_type", "entity_id"]),

  game_event_types: defineTable({
    ...sync_metadata_fields,
    name: v.string(),
    sport_id: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    affects_score: v.boolean(),
    score_value: v.optional(v.number()),
    is_active: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sport", ["sport_id"]),

  sync_metadata: defineTable({
    table_name: v.string(),
    last_sync_at: v.string(),
    sync_status: v.string(),
    error_message: v.optional(v.string()),
    records_synced: v.number(),
  }).index("by_table", ["table_name"]),
});
