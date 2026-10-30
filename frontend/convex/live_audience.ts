import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  type AnonymousFace,
  build_anonymous_face,
  credit_watch_time,
  is_valid_viewer_key,
  is_viewer_watching,
  LIVE_AUDIENCE_ACTIVE_WINDOW_MS,
  LIVE_AUDIENCE_SCAN_LIMIT,
  LIVE_AUDIENCE_SHOWN_FACES,
  LIVE_FIXTURE_STATUS,
} from "./lib/live_audience_rules";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./lib/option";
import { load_existing_sync_record } from "./lib/sync_record_store";
import { is_string } from "./lib/value_guards";

export const PresenceOutcome = {
  COUNTED: "counted",
  NOT_LIVE: "not_live",
  INVALID_VIEWER: "invalid_viewer",
} as const;

type PresenceOutcomeValue =
  (typeof PresenceOutcome)[keyof typeof PresenceOutcome];

const PRESENCE_REJECTED_EVENT = "live_audience_presence_rejected";
const VIEWER_JOINED_EVENT = "live_audience_viewer_joined";
const VIEWER_LEFT_EVENT = "live_audience_viewer_left";
const EMPTY = "";

const viewer_arguments = { fixture_id: v.string(), viewer_key: v.string() };

type ViewerRow = Doc<"live_game_viewers">;

async function read_live_fixture_organization(
  ctx: MutationCtx,
  fixture_id: string,
): Promise<Option<string>> {
  const fixture = await load_existing_sync_record(ctx, "fixtures", fixture_id);
  if (fixture.status === OptionStatus.NONE) return create_none_option();
  if (fixture.value.status !== LIVE_FIXTURE_STATUS) return create_none_option();
  return create_some_option(
    is_string(fixture.value.organization_id)
      ? fixture.value.organization_id
      : EMPTY,
  );
}

async function find_viewer(
  ctx: MutationCtx,
  fixture_id: string,
  viewer_key: string,
): Promise<Option<ViewerRow>> {
  const viewer = await ctx.db
    .query("live_game_viewers")
    .withIndex("by_fixture_viewer", (index) =>
      index.eq("fixture_id", fixture_id).eq("viewer_key", viewer_key),
    )
    .first();
  return viewer ? create_some_option(viewer) : create_none_option();
}

function reject_presence(
  outcome: PresenceOutcomeValue,
  fixture_id: string,
): PresenceOutcomeValue {
  console.warn("[LiveAudience] Presence not counted", {
    event: PRESENCE_REJECTED_EVENT,
    fixture_id,
    outcome,
  });
  return outcome;
}

async function check_viewer_in(
  ctx: MutationCtx,
  viewer: { fixture_id: string; viewer_key: string; organization_id: string },
): Promise<PresenceOutcomeValue> {
  const now_ms = Date.now();
  const existing = await find_viewer(ctx, viewer.fixture_id, viewer.viewer_key);
  switch (existing.status) {
    case OptionStatus.SOME:
      await ctx.db.patch(existing.value._id, {
        last_seen_at: now_ms,
        is_watching: true,
        watch_ms:
          existing.value.watch_ms + credit_watch_time(existing.value, now_ms),
      });
      return PresenceOutcome.COUNTED;
    case OptionStatus.NONE:
      await ctx.db.insert("live_game_viewers", {
        ...viewer,
        joined_at: now_ms,
        last_seen_at: now_ms,
        is_watching: true,
        watch_ms: 0,
      });
      console.log("[LiveAudience] Viewer joined", {
        event: VIEWER_JOINED_EVENT,
        fixture_id: viewer.fixture_id,
      });
      return PresenceOutcome.COUNTED;
  }
}

export const report_live_game_presence = mutation({
  args: viewer_arguments,
  handler: async (ctx, args): Promise<PresenceOutcomeValue> => {
    if (!is_valid_viewer_key(args.viewer_key))
      return reject_presence(PresenceOutcome.INVALID_VIEWER, args.fixture_id);
    const organization = await read_live_fixture_organization(
      ctx,
      args.fixture_id,
    );
    if (organization.status === OptionStatus.NONE)
      return reject_presence(PresenceOutcome.NOT_LIVE, args.fixture_id);
    return check_viewer_in(ctx, {
      ...args,
      organization_id: organization.value,
    });
  },
});

export const leave_live_game = mutation({
  args: viewer_arguments,
  handler: async (ctx, args): Promise<boolean> => {
    const viewer = await find_viewer(ctx, args.fixture_id, args.viewer_key);
    if (viewer.status === OptionStatus.NONE || !viewer.value.is_watching)
      return false;
    const now_ms = Date.now();
    await ctx.db.patch(viewer.value._id, {
      last_seen_at: now_ms,
      is_watching: false,
      watch_ms: viewer.value.watch_ms + credit_watch_time(viewer.value, now_ms),
    });
    console.log("[LiveAudience] Viewer left", {
      event: VIEWER_LEFT_EVENT,
      fixture_id: args.fixture_id,
    });
    return true;
  },
});

export interface LiveGameAudience {
  watching_now: number;
  is_viewer_counted: boolean;
  other_faces: AnonymousFace[];
}

export const get_live_game_audience = query({
  args: viewer_arguments,
  handler: async (ctx, args): Promise<LiveGameAudience> => {
    const now_ms = Date.now();
    const recent_viewers = await ctx.db
      .query("live_game_viewers")
      .withIndex("by_fixture_last_seen", (index) =>
        index
          .eq("fixture_id", args.fixture_id)
          .gt("last_seen_at", now_ms - LIVE_AUDIENCE_ACTIVE_WINDOW_MS),
      )
      .take(LIVE_AUDIENCE_SCAN_LIMIT);
    const watching = recent_viewers.filter((viewer) =>
      is_viewer_watching(viewer, now_ms),
    );
    const others = watching.filter(
      (viewer) => viewer.viewer_key !== args.viewer_key,
    );
    return {
      watching_now: watching.length,
      is_viewer_counted: others.length < watching.length,
      other_faces: others
        .slice(-LIVE_AUDIENCE_SHOWN_FACES)
        .map((viewer) =>
          build_anonymous_face(args.fixture_id, viewer.viewer_key),
        ),
    };
  },
});
