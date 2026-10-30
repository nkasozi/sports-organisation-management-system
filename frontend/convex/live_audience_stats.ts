import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import {
  is_viewer_watching,
  LIVE_AUDIENCE_SCAN_LIMIT,
  LIVE_AUDIENCE_STATS_LOOKBACK_MS,
  LIVE_AUDIENCE_VIEWER_RETENTION_MS,
} from "./lib/live_audience_rules";

const MAX_FIXTURES_PER_REFRESH = 50;
const PRUNE_BATCH_SIZE = 500;
const STATS_REFRESHED_EVENT = "live_audience_stats_refreshed";
const VIEWERS_PRUNED_EVENT = "live_audience_viewers_pruned";

type ViewerRow = Doc<"live_game_viewers">;

interface AudienceSnapshot {
  unique_viewers: number;
  watching_now: number;
  total_watch_ms: number;
}

function summarize_viewers(
  viewers: ViewerRow[],
  now_ms: number,
): AudienceSnapshot {
  return {
    unique_viewers: viewers.length,
    watching_now: viewers.filter((viewer) => is_viewer_watching(viewer, now_ms))
      .length,
    total_watch_ms: viewers.reduce(
      (total, viewer) => total + viewer.watch_ms,
      0,
    ),
  };
}

async function save_fixture_stats(
  ctx: MutationCtx,
  first_viewer: ViewerRow,
  snapshot: AudienceSnapshot,
  now_ms: number,
): Promise<boolean> {
  const existing = await ctx.db
    .query("live_game_viewer_stats")
    .withIndex("by_fixture", (index) =>
      index.eq("fixture_id", first_viewer.fixture_id),
    )
    .first();
  const is_new_peak =
    !existing || snapshot.watching_now > existing.peak_viewers;
  const stats = {
    fixture_id: first_viewer.fixture_id,
    organization_id: first_viewer.organization_id,
    unique_viewers: snapshot.unique_viewers,
    total_watch_ms: snapshot.total_watch_ms,
    peak_viewers: is_new_peak ? snapshot.watching_now : existing.peak_viewers,
    peak_at: is_new_peak ? now_ms : existing.peak_at,
    updated_at: now_ms,
  };
  if (existing) await ctx.db.patch(existing._id, stats);
  else await ctx.db.insert("live_game_viewer_stats", stats);
  return true;
}

async function refresh_fixture(
  ctx: MutationCtx,
  fixture_id: string,
  now_ms: number,
): Promise<boolean> {
  const viewers = await ctx.db
    .query("live_game_viewers")
    .withIndex("by_fixture_last_seen", (index) =>
      index.eq("fixture_id", fixture_id),
    )
    .take(LIVE_AUDIENCE_SCAN_LIMIT);
  if (viewers.length === 0) return false;
  return save_fixture_stats(
    ctx,
    viewers[0],
    summarize_viewers(viewers, now_ms),
    now_ms,
  );
}

export const refresh_live_game_viewer_stats = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const now_ms = Date.now();
    const recent_viewers = await ctx.db
      .query("live_game_viewers")
      .withIndex("by_last_seen", (index) =>
        index.gt("last_seen_at", now_ms - LIVE_AUDIENCE_STATS_LOOKBACK_MS),
      )
      .take(LIVE_AUDIENCE_SCAN_LIMIT);
    const fixture_ids = [
      ...new Set(recent_viewers.map((viewer) => viewer.fixture_id)),
    ].slice(0, MAX_FIXTURES_PER_REFRESH);
    for (const fixture_id of fixture_ids)
      await refresh_fixture(ctx, fixture_id, now_ms);
    if (fixture_ids.length > 0)
      console.log("[LiveAudience] Viewer stats refreshed", {
        event: STATS_REFRESHED_EVENT,
        fixture_count: fixture_ids.length,
      });
    return fixture_ids.length;
  },
});

export const prune_old_live_game_viewers = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const old_viewers = await ctx.db
      .query("live_game_viewers")
      .withIndex("by_last_seen", (index) =>
        index.lt(
          "last_seen_at",
          Date.now() - LIVE_AUDIENCE_VIEWER_RETENTION_MS,
        ),
      )
      .take(PRUNE_BATCH_SIZE);
    for (const viewer of old_viewers) await ctx.db.delete(viewer._id);
    console.log("[LiveAudience] Old viewer rows pruned", {
      event: VIEWERS_PRUNED_EVENT,
      deleted_count: old_viewers.length,
    });
    return old_viewers.length;
  },
});

export type LiveGameViewerStats =
  | { status: "none" }
  | {
      status: "present";
      unique_viewers: number;
      peak_viewers: number;
      total_watch_minutes: number;
    };

const MS_PER_MINUTE = 60_000;

export const get_live_game_viewer_stats = query({
  args: { fixture_id: v.string() },
  handler: async (ctx, args): Promise<LiveGameViewerStats> => {
    const stats = await ctx.db
      .query("live_game_viewer_stats")
      .withIndex("by_fixture", (index) =>
        index.eq("fixture_id", args.fixture_id),
      )
      .first();
    if (!stats) return { status: "none" };
    return {
      status: "present",
      unique_viewers: stats.unique_viewers,
      peak_viewers: stats.peak_viewers,
      total_watch_minutes: Math.round(stats.total_watch_ms / MS_PER_MINUTE),
    };
  },
});
