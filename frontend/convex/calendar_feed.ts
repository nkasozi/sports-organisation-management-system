import { v } from "convex/values";

import { query, type QueryCtx } from "./_generated/server";
import {
  type CalendarFeedLookup,
  CalendarFeedStatus,
  type CalendarFeedToken,
  CalendarFeedType,
  classify_calendar_token,
  select_feed_activities,
  to_calendar_feed_event,
} from "./lib/calendar_feed_scope";
import { option_from_document } from "./lib/option";
import { read_string_or } from "./lib/value_guards";

const DEFAULT_ORGANIZATION_NAME = "Sport-Sync";
const ENDED_MEMBERSHIP_STATUSES = new Set(["inactive", "ended"]);
const EMPTY_TEXT = "";
const CALENDAR_FEED_SERVED_EVENT = "calendar_feed_served";
const CALENDAR_FEED_REJECTED_EVENT = "calendar_feed_rejected";

async function load_organization_name(
  ctx: QueryCtx,
  organization_id: string,
): Promise<string> {
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_local_id", (range) => range.eq("local_id", organization_id))
    .first();
  return organization?.name || DEFAULT_ORGANIZATION_NAME;
}

async function load_player_team_ids(
  ctx: QueryCtx,
  player_id: string,
): Promise<string[]> {
  if (!player_id) return [];
  const memberships = await ctx.db
    .query("player_team_memberships")
    .withIndex("by_player", (range) => range.eq("player_id", player_id))
    .collect();
  return memberships
    .filter(
      (membership) =>
        !ENDED_MEMBERSHIP_STATUSES.has(read_string_or(membership.status, "")),
    )
    .map((membership) => read_string_or(membership.team_id, EMPTY_TEXT));
}

async function load_feed_team_ids(
  ctx: QueryCtx,
  token: CalendarFeedToken,
): Promise<ReadonlySet<string>> {
  switch (token.feed_type) {
    case CalendarFeedType.TEAM:
      return new Set(token.entity_id ? [token.entity_id] : []);
    case CalendarFeedType.PLAYER:
      return new Set(await load_player_team_ids(ctx, token.entity_id));
    case CalendarFeedType.ALL:
    case CalendarFeedType.COMPETITION:
      return new Set();
  }
}

function is_in_current_year(
  activity: Record<string, unknown>,
  now_milliseconds: number,
): boolean {
  const year = String(new Date(now_milliseconds).getUTCFullYear());
  return read_string_or(activity.start_datetime, EMPTY_TEXT).startsWith(year);
}

async function load_feed_events(
  ctx: QueryCtx,
  token: CalendarFeedToken,
  now_milliseconds: number,
): Promise<ReturnType<typeof to_calendar_feed_event>[]> {
  const activities = await ctx.db
    .query("activities")
    .withIndex("by_organization_local_id", (range) =>
      range.eq("organization_id", token.organization_id),
    )
    .collect();
  const in_window = activities.filter((activity) =>
    is_in_current_year(activity, now_milliseconds),
  );
  return select_feed_activities(
    token,
    in_window,
    await load_feed_team_ids(ctx, token),
  ).map(to_calendar_feed_event);
}

export const get_calendar_feed_by_token = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<CalendarFeedLookup> => {
    const now_milliseconds = Date.now();
    const stored_token = option_from_document(
      await ctx.db
        .query("calendar_tokens")
        .withIndex("by_token", (range) => range.eq("token", args.token))
        .first(),
    );
    const access = classify_calendar_token(stored_token, now_milliseconds);
    if (access.status !== CalendarFeedStatus.GRANTED) {
      console.warn("[CalendarFeed] Feed request rejected", {
        event: CALENDAR_FEED_REJECTED_EVENT,
        status: access.status,
      });
      return access;
    }
    const events = await load_feed_events(ctx, access.token, now_milliseconds);
    console.log("[CalendarFeed] Feed served", {
      event: CALENDAR_FEED_SERVED_EVENT,
      feed_type: access.token.feed_type,
      event_count: events.length,
    });
    return {
      status: CalendarFeedStatus.GRANTED,
      feed: {
        ...access.token,
        organization_name: await load_organization_name(
          ctx,
          access.token.organization_id,
        ),
        events,
      },
    };
  },
});
