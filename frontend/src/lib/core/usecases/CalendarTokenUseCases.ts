import type {
  CalendarToken,
  CreateCalendarTokenInput,
} from "../entities/CalendarToken";
import type { CalendarTokenRepository } from "../interfaces/ports";
import type { CalendarTokenUseCasesPort } from "../interfaces/ports";
import { CALENDAR_TOKEN_EVENT } from "./CalendarTokenConstants";
import { create_calendar_feed_methods } from "./CalendarTokenFeeds";
import { calendar_token_log_target } from "./CalendarTokenLogging";
import { relay_repository_result } from "./FailureRelay";

type CalendarTokenUseCases = CalendarTokenUseCasesPort;

interface CalendarTokenUseCasesDependencies {
  calendar_token_repository: CalendarTokenRepository;
  get_base_url: () => string;
}

function create_calendar_token_crud(
  repository: CalendarTokenRepository,
): Pick<
  CalendarTokenUseCases,
  "list" | "get_by_id" | "create" | "update" | "delete"
> {
  const log_target = calendar_token_log_target;
  return {
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options),
        log_target(CALENDAR_TOKEN_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id: CalendarToken["id"]) =>
      relay_repository_result(
        repository.find_by_id(id),
        log_target(CALENDAR_TOKEN_EVENT.LOOKUP_FAILED, { token_id: id }),
      ),
    create: async (input: CreateCalendarTokenInput) =>
      relay_repository_result(
        repository.create(input),
        log_target(CALENDAR_TOKEN_EVENT.CREATE_FAILED),
      ),
    update: async (id, updates) =>
      relay_repository_result(
        repository.update(id, updates),
        log_target(CALENDAR_TOKEN_EVENT.UPDATE_FAILED, { token_id: id }),
      ),
    delete: async (id) =>
      relay_repository_result(
        repository.delete_by_id(id),
        log_target(CALENDAR_TOKEN_EVENT.DELETE_FAILED, { token_id: id }),
      ),
  };
}

export function create_calendar_token_use_cases(
  dependencies: CalendarTokenUseCasesDependencies,
): CalendarTokenUseCases {
  return {
    ...create_calendar_token_crud(dependencies.calendar_token_repository),
    ...create_calendar_feed_methods(dependencies),
  };
}
