import { defineTable } from "convex/server";
import { v } from "convex/values";

export const schema_live_audience_tables = {
  live_game_viewers: defineTable({
    fixture_id: v.string(),
    organization_id: v.string(),
    viewer_key: v.string(),
    joined_at: v.number(),
    last_seen_at: v.number(),
    is_watching: v.boolean(),
    watch_ms: v.number(),
  })
    .index("by_fixture_viewer", ["fixture_id", "viewer_key"])
    .index("by_fixture_last_seen", ["fixture_id", "last_seen_at"])
    .index("by_last_seen", ["last_seen_at"]),
  live_game_viewer_stats: defineTable({
    fixture_id: v.string(),
    organization_id: v.string(),
    unique_viewers: v.number(),
    peak_viewers: v.number(),
    peak_at: v.number(),
    total_watch_ms: v.number(),
    updated_at: v.number(),
  }).index("by_fixture", ["fixture_id"]),
};
