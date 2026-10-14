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
import { GLOBAL_ORGANIZATION_ID } from "./lib/caller_scope";
import { type Option, option_from_document, OptionStatus } from "./lib/option";
import { SystemUserStatus } from "./lib/system_user_constants";
import { read_string_or } from "./lib/value_guards";

const DEFAULT_ORGANIZATION_NAME = "Sport-Sync";
const ENDED_MEMBERSHIP_STATUSES = new Set(["inactive", "ended"]);
const EMPTY_TEXT = "";
const CALENDAR_FEED_SERVED_EVENT = "calendar_feed_served";
const CALENDAR_FEED_REJECTED_EVENT = "calendar_feed_rejected";

type CalendarTokenAccess = ReturnType<typeof classify_calendar_token>;

const NOT_FOUND_ACCESS: CalendarTokenAccess = {
  status: CalendarFeedStatus.NOT_FOUND,
};

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

function build_year_start(year: number): string {
  return `${year}`;
}

async function load_current_year_activities(
  ctx: QueryCtx,
  organization_id: string,
  now_milliseconds: number,
): Promise<Array<Record<string, unknown>>> {
  const year = new Date(now_milliseconds).getUTCFullYear();
  return ctx.db
    .query("activities")
    .withIndex("by_organization_start", (range) =>
      range
        .eq("organization_id", organization_id)
        .gte("start_datetime", build_year_start(year))
        .lt("start_datetime", build_year_start(year + 1)),
    )
    .collect();
}

async function is_token_owner_active(
  ctx: QueryCtx,
  stored_token: Record<string, unknown>,
  organization_id: string,
): Promise<boolean> {
  const user_id = read_string_or(stored_token.user_id, EMPTY_TEXT).trim();
  if (!user_id) return false;
  const owner = await ctx.db
    .query("system_users")
    .withIndex("by_local_id", (range) => range.eq("local_id", user_id))
    .first();
  if (!owner || owner.status === SystemUserStatus.INACTIVE) return false;
  return (
    owner.organization_id === organization_id ||
    owner.organization_id === GLOBAL_ORGANIZATION_ID
  );
}

async function load_feed_events(
  ctx: QueryCtx,
  token: CalendarFeedToken,
  now_milliseconds: number,
): Promise<ReturnType<typeof to_calendar_feed_event>[]> {
  const activities = await load_current_year_activities(
    ctx,
    token.organization_id,
    now_milliseconds,
  );
  return select_feed_activities(
    token,
    activities,
    await load_feed_team_ids(ctx, token),
  ).map(to_calendar_feed_event);
}

async function confirm_token_owner(
  ctx: QueryCtx,
  stored_token: Option<Record<string, unknown>>,
  access: CalendarTokenAccess,
): Promise<CalendarTokenAccess> {
  if (access.status !== CalendarFeedStatus.GRANTED) return access;
  if (stored_token.status === OptionStatus.NONE) return NOT_FOUND_ACCESS;
  const is_owner_active = await is_token_owner_active(
    ctx,
    stored_token.value,
    access.token.organization_id,
  );
  return is_owner_active ? access : NOT_FOUND_ACCESS;
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
    const classified = classify_calendar_token(stored_token, now_milliseconds);
    const access = await confirm_token_owner(ctx, stored_token, classified);
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
