import { defineTable } from "convex/server";
import { v } from "convex/values";

import { stored_backfill_status_validator } from "./lib/sync_backfill_state";
import { stored_tombstone_visibility_validator } from "./lib/sync_tombstone_scope";

export const schema_sync_engine_tables = {
  sync_change_sequences: defineTable({
    table_name: v.string(),
    last_sequence: v.number(),
  }).index("by_table", ["table_name"]),
  sync_change_markers: defineTable({
    table_name: v.string(),
    scope_key: v.string(),
    latest_sequence: v.number(),
  }).index("by_table_scope", ["table_name", "scope_key"]),
  sync_tombstones: defineTable({
    table_name: v.string(),
    local_id: v.string(),
    version: v.number(),
    sync_sequence: v.number(),
    deleted_at: v.string(),
    scope: v.record(v.string(), v.string()),
    visibility: v.optional(stored_tombstone_visibility_validator),
  })
    .index("by_table_local_id", ["table_name", "local_id"])
    .index("by_table_sequence", ["table_name", "sync_sequence"])
    .index("by_deleted_at", ["deleted_at"]),
  sync_sequence_backfill_states: defineTable({
    table_name: v.string(),
    status: stored_backfill_status_validator,
    backfilled_count: v.number(),
    updated_at: v.string(),
  }).index("by_table", ["table_name"]),
  sync_prune_watermarks: defineTable({
    table_name: v.string(),
    pruned_through_sequence: v.number(),
  }).index("by_table", ["table_name"]),
  sync_clear_jobs: defineTable({
    kind: v.union(v.literal("clear_table"), v.literal("clear_all_demo_data")),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    requester_email: v.string(),
    permission_entity_type: v.string(),
    table_names: v.array(v.string()),
    sequence_ceilings: v.array(v.number()),
    table_index: v.number(),
    cursor_kind: v.union(v.literal("start"), v.literal("after")),
    cursor_local_id: v.string(),
    deleted_count: v.number(),
    rejected_count: v.number(),
    continuation_count: v.number(),
    failure_reason: v.union(
      v.literal(""),
      v.literal("requester_access_revoked"),
      v.literal("continuation_limit_reached"),
      v.literal("invalid_table"),
    ),
    created_at: v.string(),
    updated_at: v.string(),
  }),
};
