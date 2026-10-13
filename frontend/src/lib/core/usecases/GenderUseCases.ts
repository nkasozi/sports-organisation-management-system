import type {
  CreateGenderInput,
  Gender,
  UpdateGenderInput,
} from "$lib/core/entities/Gender";
import { validate_gender_input } from "$lib/core/entities/Gender";
import type {
  GenderFilter,
  GenderRepository,
  GenderUseCasesPort,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  GENDER_DEFAULT_QUERY_OPTIONS,
  GENDER_LIST_ALL_QUERY_OPTIONS,
  GENDER_USE_CASES_LOG_SCOPE,
  GenderUseCaseEvent,
  GenderUseCaseMessage,
} from "./GenderUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type GenderUseCases = GenderUseCasesPort;

type GenderId = ScalarValueInput<Gender["id"]>;

function fail_missing_gender_id(
  event: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: GenderUseCaseMessage.ID_REQUIRED,
  });
}

async function create_gender(
  repository: GenderRepository,
  input: CreateGenderInput,
): AsyncResult<Gender> {
  const validation_errors = validate_gender_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: GENDER_USE_CASES_LOG_SCOPE,
        event: GenderUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: { organization_id: input.organization_id },
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event: GenderUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function update_gender(
  repository: GenderRepository,
  id: GenderId,
  input: UpdateGenderInput,
): AsyncResult<Gender> {
  if (is_blank_identifier(id)) {
    return fail_missing_gender_id(GenderUseCaseEvent.UPDATE_ID_MISSING);
  }
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success) {
    return forward_dependency_result(existing_result, {
      log_scope: GENDER_USE_CASES_LOG_SCOPE,
      event: GenderUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { gender_id: id },
      user_message: GenderUseCaseMessage.NOT_FOUND,
    });
  }
  const merged_input: CreateGenderInput = { ...existing_result.data, ...input };
  const validation_errors = validate_gender_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: GENDER_USE_CASES_LOG_SCOPE,
        event: GenderUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { gender_id: id },
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event: GenderUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { gender_id: id },
  });
}

async function delete_gender(
  repository: GenderRepository,
  id: GenderId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_gender_id(GenderUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event: GenderUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { gender_id: id },
  });
}

async function get_gender_by_id(
  repository: GenderRepository,
  id: GenderId,
): AsyncResult<Gender> {
  if (is_blank_identifier(id)) {
    return fail_missing_gender_id(GenderUseCaseEvent.GET_ID_MISSING);
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event: GenderUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { gender_id: id },
  });
}

async function list_genders(
  repository: GenderRepository,
  filter: GenderFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Gender> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    log_scope: GENDER_USE_CASES_LOG_SCOPE,
    event: GenderUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

function build_gender_filter(
  filter: GenderFilter | Record<string, string> | undefined,
): GenderFilter {
  if (!filter) {
    return {};
  }
  return { status: filter.status as GenderFilter["status"] };
}

export function create_gender_use_cases(
  repository: GenderRepository,
): GenderUseCases {
  return {
    create: (input) => create_gender(repository, input),
    update: (id, input) => update_gender(repository, id, input),
    delete: (id) => delete_gender(repository, id),
    get_by_id: (id) => get_gender_by_id(repository, id),
    list: (filter, options) =>
      list_genders(
        repository,
        build_gender_filter(filter),
        options || GENDER_DEFAULT_QUERY_OPTIONS,
      ),
    list_all: () => list_genders(repository, {}, GENDER_LIST_ALL_QUERY_OPTIONS),
  };
}
