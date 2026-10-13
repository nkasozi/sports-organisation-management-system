import type {
  CreateSystemUserInput,
  SystemUser,
  UpdateSystemUserInput,
} from "$lib/core/entities/SystemUser";
import type { QueryOptions, Repository } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import type { SystemUserFilter } from "./SystemUserUseCases";
import {
  build_user_email_not_found_message,
  EmailAvailability,
  SYSTEM_USER_USE_CASES_LOG_SCOPE,
  SystemUserUseCaseEvent,
  SystemUserUseCaseMessage,
} from "./SystemUserUseCasesConstants";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type SystemUserRepository = Repository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput
>;

type SystemUserId = ScalarValueInput<SystemUser["id"]>;
type SystemUserEmail = ScalarValueInput<SystemUser["email"]>;

export async function list_filtered_system_users(
  repository: SystemUserRepository,
  filter?: SystemUserFilter,
  options?: QueryOptions,
): PaginatedAsyncResult<SystemUser> {
  const result = await repository.find_all({}, options);
  if (!result.success) {
    return forward_dependency_result(result, {
      log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
      event: SystemUserUseCaseEvent.LIST_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    });
  }
  const all_users = result.data.items;
  const filtered_users = filter
    ? filter_system_users(all_users, filter)
    : all_users;
  return create_success_result({
    ...result.data,
    items: filtered_users,
    total_count: filtered_users.length,
  });
}

function matches_email(user: SystemUser, email: SystemUserEmail): boolean {
  return user.email.toLowerCase() === email.trim().toLowerCase();
}

export async function find_system_user_by_email(
  repository: SystemUserRepository,
  email: SystemUserEmail,
): AsyncResult<SystemUser> {
  if (is_blank_identifier(email)) {
    return fail_missing_identifier({
      log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
      event: SystemUserUseCaseEvent.GET_BY_EMAIL_MISSING,
      context: {},
      user_message: SystemUserUseCaseMessage.EMAIL_REQUIRED,
    });
  }
  const all_result = await repository.find_all();
  if (!all_result.success) {
    return forward_dependency_result(all_result, {
      log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
      event: SystemUserUseCaseEvent.GET_BY_EMAIL_LOOKUP_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    });
  }
  const found_user = all_result.data.items.find((user) =>
    matches_email(user, email),
  );
  if (!found_user) {
    return fail_with_message(
      {
        log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
        event: SystemUserUseCaseEvent.GET_BY_EMAIL_NOT_FOUND,
        context: {},
        user_message: build_user_email_not_found_message(email),
      },
      UseCaseErrorCode.NOT_FOUND,
    );
  }
  return create_success_result(found_user);
}

function filter_system_users(
  users: SystemUser[],
  filter: SystemUserFilter,
): SystemUser[] {
  return users.filter((user) => {
    if (
      filter.email &&
      !user.email.toLowerCase().includes(filter.email.toLowerCase())
    ) {
      return false;
    }
    if (filter.role && user.role !== filter.role) {
      return false;
    }
    if (filter.status && user.status !== filter.status) {
      return false;
    }
    return true;
  });
}

export async function check_email_availability(
  repository: SystemUserRepository,
  email: SystemUserEmail,
  exclude_user_id?: SystemUserId,
): Promise<Result<EmailAvailability, string>> {
  const all_result = await repository.find_all();
  if (!all_result.success) {
    return all_result;
  }
  const existing_user = all_result.data.items.find(
    (user) => matches_email(user, email) && user.id !== exclude_user_id,
  );
  return create_success_result(
    existing_user ? EmailAvailability.TAKEN : EmailAvailability.AVAILABLE,
  );
}

export async function get_system_user_by_id(
  repository: SystemUserRepository,
  id: SystemUserId,
): AsyncResult<SystemUser> {
  if (is_blank_identifier(id)) {
    return fail_missing_identifier({
      log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
      event: SystemUserUseCaseEvent.GET_ID_MISSING,
      context: {},
      user_message: SystemUserUseCaseMessage.ID_REQUIRED,
    });
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
    event: SystemUserUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { user_id: id },
  });
}
