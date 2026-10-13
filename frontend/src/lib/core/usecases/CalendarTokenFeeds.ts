import type { CreateCalendarTokenInput } from "../entities/CalendarToken";
import type { CalendarToken } from "../entities/CalendarToken";
import {
  build_ical_feed_url,
  build_webcal_feed_url,
  generate_calendar_token,
} from "../entities/CalendarToken";
import type {
  CalendarFeedInfo,
  CalendarTokenRepository,
  CalendarTokenUseCasesPort,
} from "../interfaces/ports";
import { is_calendar_token_not_found_error } from "../interfaces/ports";
import type { CalendarTokenValue } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  CALENDAR_TOKEN_EVENT,
  CALENDAR_TOKEN_MESSAGE,
  DEFAULT_REMINDER_MINUTES,
} from "./CalendarTokenConstants";
import { calendar_token_log_target as log_target } from "./CalendarTokenLogging";
import {
  relay_repository_failure,
  relay_repository_result,
} from "./FailureRelay";

type CalendarFeedMethods = Omit<
  CalendarTokenUseCasesPort,
  "list" | "get_by_id" | "create" | "update" | "delete"
>;

type CreateFeedArguments = Parameters<CalendarFeedMethods["create_feed"]>;

interface CalendarFeedDependencies {
  calendar_token_repository: CalendarTokenRepository;
  get_base_url: () => string;
}

async function create_feed(
  dependencies: CalendarFeedDependencies,
  ...[
    user_id,
    organization_id,
    feed_type,
    entity_id,
    entity_name,
    reminder_minutes_before = DEFAULT_REMINDER_MINUTES,
  ]: CreateFeedArguments
): AsyncResult<CalendarFeedInfo> {
  const token = generate_calendar_token();
  const input: CreateCalendarTokenInput = {
    token,
    user_id,
    organization_id,
    feed_type,
    entity_id,
    entity_name,
    reminder_minutes_before,
    is_active: true,
  };
  const create_result =
    await dependencies.calendar_token_repository.create(input);
  if (!create_result.success)
    return relay_repository_failure(
      log_target(CALENDAR_TOKEN_EVENT.FEED_CREATE_FAILED, { feed_type }),
      create_result.error,
    );
  const base_url = dependencies.get_base_url();
  return create_success_result({
    token: create_result.data,
    https_url: build_ical_feed_url(base_url, token),
    webcal_url: build_webcal_feed_url(base_url, token),
  });
}

async function update_feed_settings(
  repository: CalendarTokenRepository,
  token: CalendarTokenValue,
  reminder_minutes_before: number,
): AsyncResult<CalendarToken> {
  const find_result = await repository.find_by_token(token);
  if (
    !find_result.success &&
    is_calendar_token_not_found_error(find_result.error, token)
  )
    return fail_use_case({
      code: UseCaseErrorCode.NOT_FOUND,
      ...log_target(CALENDAR_TOKEN_EVENT.FEED_SETTINGS_TOKEN_MISSING),
      user_message: CALENDAR_TOKEN_MESSAGE.TOKEN_NOT_FOUND,
    });
  if (!find_result.success)
    return relay_repository_failure(
      log_target(CALENDAR_TOKEN_EVENT.FEED_SETTINGS_LOOKUP_FAILED),
      find_result.error,
    );
  return relay_repository_result(
    repository.update(find_result.data.id, { reminder_minutes_before }),
    log_target(CALENDAR_TOKEN_EVENT.FEED_SETTINGS_UPDATE_FAILED, {
      token_id: find_result.data.id,
    }),
  );
}

export function create_calendar_feed_methods(
  dependencies: CalendarFeedDependencies,
): CalendarFeedMethods {
  const repository = dependencies.calendar_token_repository;
  return {
    create_feed: (...feed_arguments) =>
      create_feed(dependencies, ...feed_arguments),
    list_user_feeds: async (user_id, options) =>
      relay_repository_result(
        repository.find_by_user(user_id, options),
        log_target(CALENDAR_TOKEN_EVENT.LIST_FAILED, { user_id }),
      ),
    get_feed_by_token: async (token) => repository.find_by_token(token),
    revoke_feed: async (token) =>
      relay_repository_result(
        repository.deactivate_token(token),
        log_target(CALENDAR_TOKEN_EVENT.FEED_REVOKE_FAILED),
      ),
    update_feed_settings: (token, reminder_minutes_before) =>
      update_feed_settings(repository, token, reminder_minutes_before),
    record_feed_access: async (token) =>
      relay_repository_result(
        repository.record_access(token),
        log_target(CALENDAR_TOKEN_EVENT.FEED_ACCESS_RECORD_FAILED),
      ),
  };
}
