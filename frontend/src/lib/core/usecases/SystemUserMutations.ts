import type {
  CreateSystemUserInput,
  SystemUser,
  UpdateSystemUserInput,
} from "$lib/core/entities/SystemUser";
import { validate_system_user_input } from "$lib/core/entities/SystemUser";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  check_email_availability,
  type SystemUserRepository,
} from "./SystemUserQueries";
import {
  EmailAvailability,
  SYSTEM_USER_USE_CASES_LOG_SCOPE,
  SystemUserUseCaseEvent,
  SystemUserUseCaseMessage,
} from "./SystemUserUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

type SystemUserId = ScalarValueInput<SystemUser["id"]>;

interface EmailCheckEvents {
  check_failed: string;
  taken: string;
}

function fail_missing_user_id(
  event: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: SystemUserUseCaseMessage.ID_REQUIRED,
  });
}

async function ensure_email_available(
  repository: SystemUserRepository,
  email: string,
  events: EmailCheckEvents,
  exclude_user_id?: SystemUserId,
): Promise<Result<EmailAvailability, string>> {
  const context =
    exclude_user_id === undefined ? {} : { user_id: exclude_user_id };
  const availability_result = await check_email_availability(
    repository,
    email as SystemUser["email"],
    exclude_user_id,
  );
  if (!availability_result.success) {
    return forward_dependency_result(availability_result, {
      log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
      event: events.check_failed,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context,
    });
  }
  switch (availability_result.data) {
    case EmailAvailability.AVAILABLE:
      return availability_result;
    case EmailAvailability.TAKEN:
      return fail_with_message(
        {
          log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
          event: events.taken,
          context,
          user_message: SystemUserUseCaseMessage.DUPLICATE_EMAIL,
        },
        UseCaseErrorCode.CONFLICT,
      );
  }
}

export async function create_system_user(
  repository: SystemUserRepository,
  input: CreateSystemUserInput,
): AsyncResult<SystemUser> {
  const validation_errors = validate_system_user_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
        event: SystemUserUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: { organization_id: input.organization_id },
      },
      validation_errors,
    );
  }
  const email_result = await ensure_email_available(repository, input.email, {
    check_failed: SystemUserUseCaseEvent.CREATE_EMAIL_CHECK_FAILED,
    taken: SystemUserUseCaseEvent.CREATE_EMAIL_TAKEN,
  });
  if (!email_result.success) {
    return email_result;
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
    event: SystemUserUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function ensure_updated_email_available(
  repository: SystemUserRepository,
  id: SystemUserId,
  email: string | undefined,
): Promise<Result<EmailAvailability, string>> {
  if (!email) {
    return create_success_result(EmailAvailability.AVAILABLE);
  }
  return ensure_email_available(
    repository,
    email,
    {
      check_failed: SystemUserUseCaseEvent.UPDATE_EMAIL_CHECK_FAILED,
      taken: SystemUserUseCaseEvent.UPDATE_EMAIL_TAKEN,
    },
    id,
  );
}

export async function update_system_user(
  repository: SystemUserRepository,
  id: SystemUserId,
  input: UpdateSystemUserInput,
): AsyncResult<SystemUser> {
  if (is_blank_identifier(id)) {
    return fail_missing_user_id(SystemUserUseCaseEvent.UPDATE_ID_MISSING);
  }
  const email_result = await ensure_updated_email_available(
    repository,
    id,
    input.email,
  );
  if (!email_result.success) {
    return email_result;
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
    event: SystemUserUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { user_id: id },
  });
}

export async function delete_system_user(
  repository: SystemUserRepository,
  id: SystemUserId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_user_id(SystemUserUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: SYSTEM_USER_USE_CASES_LOG_SCOPE,
    event: SystemUserUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { user_id: id },
  });
}
