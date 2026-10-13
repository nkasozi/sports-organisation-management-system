import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionFormatUseCasesPort } from "../interfaces/ports";
import {
  COMPETITION_FORMAT_EVENT,
  COMPETITION_FORMAT_LOG_SCOPE,
  COMPETITION_FORMAT_MESSAGE,
} from "./CompetitionFormatConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

type CompetitionFormatQueries = Pick<
  CompetitionFormatUseCasesPort,
  | "list"
  | "get_by_id"
  | "delete"
  | "get_format_by_code"
  | "list_formats_by_type"
  | "list_active_formats"
>;

const log_target = create_log_target_builder(COMPETITION_FORMAT_LOG_SCOPE);

function fail_missing_format_id(): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier(
    log_target(COMPETITION_FORMAT_EVENT.ID_MISSING),
    COMPETITION_FORMAT_MESSAGE.ID_REQUIRED,
  );
}

export function create_competition_format_queries(
  repository: CompetitionFormatRepository,
): CompetitionFormatQueries {
  const list_failed = log_target(COMPETITION_FORMAT_EVENT.LIST_FAILED);
  return {
    list: async (filter, pagination) =>
      relay_repository_result(
        repository.find_all(filter, pagination),
        list_failed,
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_format_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(COMPETITION_FORMAT_EVENT.LOOKUP_FAILED, {
              format_id: id,
            }),
          ),
    delete: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_format_id()
        : relay_repository_result(
            repository.delete_by_id(id),
            log_target(COMPETITION_FORMAT_EVENT.DELETE_FAILED, {
              format_id: id,
            }),
          ),
    get_format_by_code: async (code) => repository.find_by_code(code),
    list_formats_by_type: async (format_type) =>
      relay_repository_result(
        repository.find_by_format_type(format_type),
        log_target(COMPETITION_FORMAT_EVENT.LIST_FAILED, { format_type }),
      ),
    list_active_formats: async () =>
      relay_repository_result(repository.find_active_formats(), list_failed),
  };
}
