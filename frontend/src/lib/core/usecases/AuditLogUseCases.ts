import type { AuditLog, CreateAuditLogInput } from "../entities/AuditLog";
import type { AuditLogFilter, AuditLogRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  AUDIT_LOG_EVENT,
  AUDIT_LOG_LOG_SCOPE,
  AUDIT_LOG_MESSAGE,
} from "./AuditLogConstants";
import { create_audit_log_queries } from "./AuditLogQueries";
import {
  create_log_target_builder,
  fail_validation,
  relay_repository_result,
} from "./FailureRelay";

export interface AuditLogUseCases {
  list(
    filter?: AuditLogFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog>;
  get_by_id(id: ScalarValueInput<AuditLog["id"]>): AsyncResult<AuditLog>;
  create(input: CreateAuditLogInput): AsyncResult<AuditLog>;
  update(
    id: ScalarValueInput<AuditLog["id"]>,
    input: Record<string, unknown>,
  ): AsyncResult<AuditLog>;
  delete(id: ScalarValueInput<AuditLog["id"]>): AsyncResult<boolean>;
  get_entity_history(
    entity_type: string,
    entity_id: ScalarValueInput<AuditLog["entity_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog>;
  get_user_activity(
    user_id: ScalarValueInput<AuditLog["user_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog>;
}

const log_target = create_log_target_builder(AUDIT_LOG_LOG_SCOPE);

function collect_audit_log_input_errors(input: CreateAuditLogInput): string[] {
  const required_checks: Array<[boolean, string]> = [
    [!input.entity_type?.trim(), AUDIT_LOG_MESSAGE.ENTITY_TYPE_REQUIRED],
    [!input.entity_id?.trim(), AUDIT_LOG_MESSAGE.ENTITY_ID_REQUIRED],
    [!input.action, AUDIT_LOG_MESSAGE.ACTION_REQUIRED],
    [!input.user_id?.trim(), AUDIT_LOG_MESSAGE.USER_ID_REQUIRED],
  ];
  return required_checks
    .filter(([is_missing]) => is_missing)
    .map(([, message]) => message);
}

async function create_audit_log(
  repository: AuditLogRepository,
  input: CreateAuditLogInput,
): AsyncResult<AuditLog> {
  const validation_errors = collect_audit_log_input_errors(input);
  if (validation_errors.length > 0)
    return fail_validation(
      log_target(AUDIT_LOG_EVENT.VALIDATION_FAILED),
      validation_errors.join(", "),
    );
  return relay_repository_result(
    repository.create(input),
    log_target(AUDIT_LOG_EVENT.CREATE_FAILED, {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
    }),
  );
}

function reject_audit_log_mutation(
  id: ScalarValueInput<AuditLog["id"]>,
  user_message: string,
): ReturnType<typeof fail_use_case> {
  return fail_use_case({
    code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
    ...log_target(AUDIT_LOG_EVENT.MUTATION_REJECTED, { audit_log_id: id }),
    user_message,
  });
}

export function create_audit_log_use_cases(
  repository: AuditLogRepository,
): AuditLogUseCases {
  return {
    ...create_audit_log_queries(repository),
    create: (input) => create_audit_log(repository, input),
    update: async (id) =>
      reject_audit_log_mutation(id, AUDIT_LOG_MESSAGE.UPDATE_REJECTED),
    delete: async (id) =>
      reject_audit_log_mutation(id, AUDIT_LOG_MESSAGE.DELETE_REJECTED),
  };
}

export type { AuditLogFilter };
