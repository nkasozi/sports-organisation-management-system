import type {
  CalendarFeedType,
  CalendarToken,
} from "$lib/core/entities/CalendarToken";
import {
  build_ical_feed_url,
  build_webcal_feed_url,
} from "$lib/core/entities/CalendarToken";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import type { UseCasesContainer } from "$lib/infrastructure/container";

const CALENDAR_SUBSCRIPTION_TEXT = {
  copy_clipboard_failed: "[CalendarSubscription] Clipboard write failed",
  copy_clipboard_failed_event: "calendar_subscription_clipboard_write_failed",
} as const;

export const CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
] as const;

export async function load_calendar_subscription_manager_data(command: {
  organization_id: string;
  user_id: string;
  use_cases: UseCasesContainer;
}): Promise<{
  competitions: Competition[];
  existing_feeds: CalendarToken[];
  teams: Team[];
}> {
  const [feeds_result, teams_result, competitions_result] = await Promise.all([
    command.use_cases.calendar_token_use_cases.list_user_feeds(command.user_id),
    command.use_cases.team_use_cases.list({
      organization_id: command.organization_id,
    }),
    command.use_cases.competition_use_cases.list({
      organization_id: command.organization_id,
    }),
  ]);
  return {
    existing_feeds:
      feeds_result.success && feeds_result.data ? feeds_result.data.items : [],
    teams:
      teams_result.success && teams_result.data ? teams_result.data.items : [],
    competitions:
      competitions_result.success && competitions_result.data
        ? competitions_result.data.items
        : [],
  };
}

export async function create_calendar_subscription_feed(command: {
  competitions: Competition[];
  organization_id: string;
  reminder_minutes: number;
  selected_entity_id: string | null;
  selected_feed_type: CalendarFeedType;
  teams: Team[];
  user_id: string;
  use_cases: UseCasesContainer;
}): Promise<{ success: false } | { success: true; token: CalendarToken }> {
  const entity_name = resolve_calendar_subscription_entity_name(command);
  const result = await command.use_cases.calendar_token_use_cases.create_feed(
    command.user_id,
    command.organization_id,
    command.selected_feed_type,
    command.selected_entity_id,
    entity_name,
    command.reminder_minutes,
  );
  if (!result.success || !result.data) {
    return { success: false };
  }
  return { success: true, token: result.data.token };
}

export async function revoke_calendar_subscription_feed(command: {
  token: string;
  use_cases: UseCasesContainer;
}): Promise<boolean> {
  const result = await command.use_cases.calendar_token_use_cases.revoke_feed(
    command.token,
  );
  return result.success;
}

export function get_calendar_subscription_https_url(command: {
  base_url: string;
  token: string;
}): string {
  return build_ical_feed_url(command.base_url, command.token);
}

export function get_calendar_subscription_webcal_url(command: {
  base_url: string;
  token: string;
}): string {
  return build_webcal_feed_url(command.base_url, command.token);
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
  if (command.selected_feed_type === "team") {
    return command.teams.map((team: Team) => ({
      id: team.id,
      name: team.name,
    }));
  }
  if (command.selected_feed_type === "competition") {
    return command.competitions.map((competition: Competition) => ({
      id: competition.id,
      name: competition.name,
    }));
  }
  return [];
}

export function format_calendar_subscription_date(
  iso_string: string | null,
): string {
  if (!iso_string) {
    return "Never";
  }
  return new Date(iso_string).toLocaleDateString();
}

function resolve_calendar_subscription_entity_name(command: {
  competitions: Competition[];
  selected_entity_id: string | null;
  selected_feed_type: CalendarFeedType;
  teams: Team[];
}): string | null {
  if (command.selected_feed_type === "team" && command.selected_entity_id) {
    return (
      command.teams.find((team: Team) => team.id === command.selected_entity_id)
        ?.name ?? null
    );
  }
  if (
    command.selected_feed_type === "competition" &&
    command.selected_entity_id
  ) {
    return (
      command.competitions.find(
        (competition: Competition) =>
          competition.id === command.selected_entity_id,
      )?.name ?? null
    );
  }
  return null;
}
