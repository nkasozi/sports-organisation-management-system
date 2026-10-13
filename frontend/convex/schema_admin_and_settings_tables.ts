import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
  ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
  ORGANIZATION_LOCAL_ID_INDEX_NAME,
  sync_metadata_fields,
  timestamp_fields,
} from "./schema_validators";

export const schema_admin_and_settings_tables = {
  sync_metadata: defineTable({
    table_name: v.string(),
    last_sync_at: v.string(),
    sync_status: v.string(),
    error_message: v.optional(v.string()),
    records_synced: v.number(),
  }).index("by_table", ["table_name"]),
  role_permissions: defineTable({
    role: v.string(),
    data_category: v.string(),
    can_create: v.boolean(),
    can_read: v.boolean(),
    can_update: v.boolean(),
    can_delete: v.boolean(),
    ...timestamp_fields,
  })
    .index("by_role", ["role"])
    .index("by_role_category", ["role", "data_category"]),
  entity_data_categories: defineTable({
    entity_type: v.string(),
    data_category: v.string(),
    ...timestamp_fields,
  }).index("by_entity_type", ["entity_type"]),
  sidebar_menu_items: defineTable({
    role: v.string(),
    group_name: v.string(),
    item_name: v.string(),
    item_href: v.string(),
    item_icon: v.string(),
    group_order: v.number(),
    item_order: v.number(),
    ...timestamp_fields,
  })
    .index("by_role", ["role"])
    .index("by_role_group", ["role", "group_name"]),
  user_profiles: defineTable({
    clerk_user_id: v.string(),
    email: v.string(),
    display_name: v.string(),
    role: v.string(),
    organization_id: v.optional(v.string()),
    team_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
    is_active: v.boolean(),
    last_login_at: v.optional(v.string()),
    ...timestamp_fields,
  })
    .index("by_clerk_user_id", ["clerk_user_id"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
  organization_settings: defineTable({
    ...sync_metadata_fields,
    organization_id: v.string(),
    display_name: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    tagline: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    contact_address: v.optional(v.string()),
    social_media_links: v.optional(
      v.array(v.object({ platform: v.string(), url: v.string() })),
    ),
    header_pattern: v.optional(v.string()),
    footer_pattern: v.optional(v.string()),
    background_pattern_url: v.optional(v.string()),
    show_panel_borders: v.optional(v.boolean()),
    primary_color: v.optional(v.string()),
    secondary_color: v.optional(v.string()),
    sync_interval_ms: v.optional(v.number()),
    ...timestamp_fields,
  })
    .index("by_local_id", ["local_id"])
    .index("by_sync_sequence", ["sync_sequence"])
    .index(ORGANIZATION_LOCAL_ID_INDEX_NAME, [
      ...ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
    ])
    .index("by_organization", ["organization_id"]),
};
