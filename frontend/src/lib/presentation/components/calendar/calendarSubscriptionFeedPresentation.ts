import {
  build_ical_feed_url,
  build_webcal_feed_url,
  CALENDAR_FEED_TYPE,
  type CalendarFeedType,
  type CalendarToken,
} from "$lib/core/entities/CalendarToken";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import {
  parse_calendar_token_value,
  parse_name,
} from "$lib/core/types/DomainScalars";

const CALENDAR_SUBSCRIPTION_TEXT = {
  copy_clipboard_failed: "[CalendarSubscription] Clipboard write failed",
  copy_clipboard_failed_event: "calendar_subscription_clipboard_write_failed",
  player_feed_name: "Player Feed",
  player_feed_name_invalid: "[CalendarSubscription] Player feed name invalid",
  player_feed_name_invalid_event:
    "calendar_subscription_player_feed_name_invalid",
  never_used: "Never",
} as const;

export function get_calendar_subscription_https_url(command: {
  base_url: string;
  token: string;
}): string {
  const token_result = parse_calendar_token_value(command.token);

  if (!token_result.success) {
    return "";
  }

  return build_ical_feed_url(command.base_url, token_result.data);
}

export function get_calendar_subscription_webcal_url(command: {
  base_url: string;
  token: string;
}): string {
  const token_result = parse_calendar_token_value(command.token);

  if (!token_result.success) {
    return "";
  }

  return build_webcal_feed_url(command.base_url, token_result.data);
}

export async function copy_calendar_subscription_to_clipboard(
  text: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn(CALENDAR_SUBSCRIPTION_TEXT.copy_clipboard_failed, {
      event: CALENDAR_SUBSCRIPTION_TEXT.copy_clipboard_failed_event,
      error: String(error),
    });
    return false;
  }
}

export function get_calendar_subscription_entity_options(command: {
  competitions: Competition[];
  selected_feed_type: CalendarFeedType;
  teams: Team[];
}): Array<{ id: string; name: string }> {
  switch (command.selected_feed_type) {
    case CALENDAR_FEED_TYPE.TEAM:
      return command.teams.map((team: Team) => ({
        id: team.id,
        name: team.name,
      }));
    case CALENDAR_FEED_TYPE.COMPETITION:
      return command.competitions.map((competition: Competition) => ({
        id: competition.id,
        name: competition.name,
      }));
    case CALENDAR_FEED_TYPE.ALL:
    case CALENDAR_FEED_TYPE.PLAYER:
      return [];
  }
}

export function format_calendar_subscription_date(iso_string: string): string {
  if (!iso_string) {
    return CALENDAR_SUBSCRIPTION_TEXT.never_used;
  }
  return new Date(iso_string).toLocaleDateString();
}

function find_entity_name(
  entities: Array<{ id: string; name: CalendarToken["entity_name"] }>,
  selected_entity_id: string,
): CalendarToken["entity_name"] {
  if (!selected_entity_id) return "";
  return (
    entities.find((entity) => entity.id === selected_entity_id)?.name ?? ""
  );
}

function build_player_feed_name(): CalendarToken["entity_name"] {
  const name_result = parse_name(CALENDAR_SUBSCRIPTION_TEXT.player_feed_name);
  if (name_result.success) return name_result.data;
  console.error(CALENDAR_SUBSCRIPTION_TEXT.player_feed_name_invalid, {
    event: CALENDAR_SUBSCRIPTION_TEXT.player_feed_name_invalid_event,
    error: name_result.error,
  });
  return "";
}

export function resolve_calendar_subscription_entity_name(command: {
  competitions: Competition[];
  selected_entity_id: string;
  selected_feed_type: CalendarFeedType;
  teams: Team[];
}): CalendarToken["entity_name"] {
  switch (command.selected_feed_type) {
    case CALENDAR_FEED_TYPE.TEAM:
      return find_entity_name(command.teams, command.selected_entity_id);
    case CALENDAR_FEED_TYPE.COMPETITION:
      return find_entity_name(command.competitions, command.selected_entity_id);
    case CALENDAR_FEED_TYPE.PLAYER:
      return build_player_feed_name();
    case CALENDAR_FEED_TYPE.ALL:
      return "";
  }
}

function get_current_origin(): string {
  return globalThis.location?.origin ?? "";
}

export function get_current_origin_https_url(token: string): string {
  return get_calendar_subscription_https_url({
    base_url: get_current_origin(),
    token,
  });
}

export function get_current_origin_webcal_url(token: string): string {
  return get_calendar_subscription_webcal_url({
    base_url: get_current_origin(),
    token,
  });
}
