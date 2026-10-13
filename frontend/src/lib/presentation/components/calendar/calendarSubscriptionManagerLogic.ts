import type {
  CalendarFeedType,
  CalendarToken,
} from "$lib/core/entities/CalendarToken";
import { parse_calendar_feed_entity_id } from "$lib/core/entities/CalendarToken";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import {
  type EntityId,
  parse_calendar_token_value,
  parse_entity_id,
} from "$lib/core/types/DomainScalars";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import type { UseCasesContainer } from "$lib/infrastructure/container";

import { resolve_calendar_subscription_entity_name } from "./calendarSubscriptionFeedPresentation";
import {
  CALENDAR_SUBSCRIPTION_LOG_EVENTS,
  CALENDAR_SUBSCRIPTION_LOG_TAG,
  CALENDAR_SUBSCRIPTION_MESSAGES,
} from "./calendarSubscriptionMessages";

export {
  copy_calendar_subscription_to_clipboard,
  format_calendar_subscription_date,
  get_calendar_subscription_entity_options,
  get_calendar_subscription_https_url,
  get_calendar_subscription_webcal_url,
} from "./calendarSubscriptionFeedPresentation";

export const CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
] as const;

interface CalendarSubscriptionManagerData {
  competitions: Competition[];
  existing_feeds: CalendarToken[];
  teams: Team[];
}

function fail_calendar_subscription<TData>(
  event: string,
  details: Record<string, unknown>,
  user_message: string,
): Result<TData> {
  console.error(CALENDAR_SUBSCRIPTION_LOG_TAG, { event, ...details });
  return create_failure_result(user_message);
}

function parse_calendar_subscription_scope(command: {
  organization_id: string;
  user_id: string;
}): Result<{ organization_id: EntityId; user_id: EntityId }> {
  const organization_id_result = parse_entity_id(
    command.organization_id,
    CALENDAR_SUBSCRIPTION_MESSAGES.ORGANIZATION_ID_INVALID,
  );
  if (!organization_id_result.success) return organization_id_result;
  const user_id_result = parse_entity_id(
    command.user_id,
    CALENDAR_SUBSCRIPTION_MESSAGES.USER_ID_INVALID,
  );
  if (!user_id_result.success) return user_id_result;
  return create_success_result({
    organization_id: organization_id_result.data,
    user_id: user_id_result.data,
  });
}

interface CalendarSubscriptionLoadCommand {
  organization_id: string;
  user_id: string;
  use_cases: UseCasesContainer;
}

interface CalendarSubscriptionCreateCommand extends CalendarSubscriptionLoadCommand {
  competitions: Competition[];
  reminder_minutes: number;
  selected_entity_id: string;
  selected_feed_type: CalendarFeedType;
  teams: Team[];
}

export async function load_calendar_subscription_manager_data(
  command: CalendarSubscriptionLoadCommand,
): AsyncResult<CalendarSubscriptionManagerData> {
  const scope_result = parse_calendar_subscription_scope(command);
  if (!scope_result.success) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.LOAD_SCOPE_INVALID,
      {},
      CALENDAR_SUBSCRIPTION_MESSAGES.INVALID_SCOPE,
    );
  }
  const { organization_id, user_id } = scope_result.data;
  const [feeds_result, teams_result, competitions_result] = await Promise.all([
    command.use_cases.calendar_token_use_cases.list_user_feeds(user_id),
    command.use_cases.team_use_cases.list({ organization_id }),
    command.use_cases.competition_use_cases.list({ organization_id }),
  ]);
  const lookup_status = {
    feeds_ok: feeds_result.success,
    teams_ok: teams_result.success,
    competitions_ok: competitions_result.success,
  };
  if (
    !feeds_result.success ||
    !teams_result.success ||
    !competitions_result.success
  ) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.LOAD_FAILED,
      { organization_id: command.organization_id, ...lookup_status },
      CALENDAR_SUBSCRIPTION_MESSAGES.LOAD_FAILED,
    );
  }
  return create_success_result({
    existing_feeds: feeds_result.data.items,
    teams: teams_result.data.items,
    competitions: competitions_result.data.items,
  });
}

export async function create_calendar_subscription_feed(
  command: CalendarSubscriptionCreateCommand,
): AsyncResult<CalendarToken> {
  const scope_result = parse_calendar_subscription_scope(command);
  const entity_id_result = parse_calendar_feed_entity_id(
    command.selected_feed_type,
    command.selected_entity_id,
  );
  if (!scope_result.success || !entity_id_result.success) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.CREATE_INPUT_INVALID,
      { feed_type: command.selected_feed_type },
      CALENDAR_SUBSCRIPTION_MESSAGES.CREATE_FAILED,
    );
  }
  const result = await command.use_cases.calendar_token_use_cases.create_feed(
    scope_result.data.user_id,
    scope_result.data.organization_id,
    command.selected_feed_type,
    entity_id_result.data,
    resolve_calendar_subscription_entity_name(command),
    command.reminder_minutes,
  );
  if (!result.success) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.CREATE_FAILED,
      { feed_type: command.selected_feed_type, error: result.error },
      CALENDAR_SUBSCRIPTION_MESSAGES.CREATE_FAILED,
    );
  }
  return create_success_result(result.data.token);
}

export async function revoke_calendar_subscription_feed(command: {
  token: string;
  use_cases: UseCasesContainer;
}): AsyncResult<true> {
  const token_result = parse_calendar_token_value(command.token);
  if (!token_result.success) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.REVOKE_INPUT_INVALID,
      {},
      CALENDAR_SUBSCRIPTION_MESSAGES.REVOKE_FAILED,
    );
  }
  const result = await command.use_cases.calendar_token_use_cases.revoke_feed(
    token_result.data,
  );
  if (!result.success) {
    return fail_calendar_subscription(
      CALENDAR_SUBSCRIPTION_LOG_EVENTS.REVOKE_FAILED,
      {
        error: result.error,
      },
      CALENDAR_SUBSCRIPTION_MESSAGES.REVOKE_FAILED,
    );
  }
  return create_success_result(true);
}
