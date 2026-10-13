import type { AuditLogRepository } from "../interfaces/ports";
import {
  AUDIT_LOG_EVENT,
  AUDIT_LOG_LOG_SCOPE,
  AUDIT_LOG_MESSAGE,
} from "./AuditLogConstants";
import type { AuditLogUseCases } from "./AuditLogUseCases";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

type AuditLogQueries = Pick<
  AuditLogUseCases,
  "list" | "get_by_id" | "get_entity_history" | "get_user_activity"
>;

const log_target = create_log_target_builder(AUDIT_LOG_LOG_SCOPE);

function create_history_queries(
  repository: AuditLogRepository,
): Pick<AuditLogQueries, "get_entity_history" | "get_user_activity"> {
  return {
    async get_entity_history(entity_type, entity_id, options) {
      if (is_blank_identifier(entity_type))
        return fail_missing_identifier(
          log_target(AUDIT_LOG_EVENT.ENTITY_TYPE_MISSING),
          AUDIT_LOG_MESSAGE.ENTITY_TYPE_REQUIRED,
        );
      if (is_blank_identifier(entity_id))
        return fail_missing_identifier(
          log_target(AUDIT_LOG_EVENT.ENTITY_ID_MISSING, { entity_type }),
          AUDIT_LOG_MESSAGE.ENTITY_ID_REQUIRED,
        );
      return relay_repository_result(
        repository.find_by_entity(entity_type, entity_id, options),
        log_target(AUDIT_LOG_EVENT.LIST_FAILED, { entity_type, entity_id }),
      );
    },
    get_user_activity: async (user_id, options) =>
      is_blank_identifier(user_id)
        ? fail_missing_identifier(
            log_target(AUDIT_LOG_EVENT.USER_ID_MISSING),
            AUDIT_LOG_MESSAGE.USER_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_all({ user_id }, options),
            log_target(AUDIT_LOG_EVENT.LIST_FAILED, { user_id }),
          ),
  };
}

export function create_audit_log_queries(
  repository: AuditLogRepository,
): AuditLogQueries {
  return {
    ...create_history_queries(repository),
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(AUDIT_LOG_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_identifier(
            log_target(AUDIT_LOG_EVENT.ID_MISSING),
            AUDIT_LOG_MESSAGE.ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(AUDIT_LOG_EVENT.LOOKUP_FAILED, { audit_log_id: id }),
          ),
  };
}
