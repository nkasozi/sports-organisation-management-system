import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "$lib/core/entities/Sport";
import type {
  QueryOptions,
  SportFilter,
  SportRepository,
  SportUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  SPORT_USE_CASES_LOG_SCOPE,
  SportUseCaseEvent,
  SportUseCaseMessage,
} from "./SportUseCasesConstants";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type SportUseCases = SportUseCasesPort;

type SportId = ScalarValueInput<Sport["id"]>;

function fail_missing_sport_id(
  event: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: SportUseCaseMessage.ID_REQUIRED,
  });
}

async function list_sports(
  repository: SportRepository,
  filter: SportFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Sport> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

async function get_sport_by_id(
  repository: SportRepository,
  id: SportId,
): AsyncResult<Sport> {
  if (is_blank_identifier(id)) {
    return fail_missing_sport_id(SportUseCaseEvent.GET_ID_MISSING);
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { sport_id: id },
  });
}

async function create_sport(
  repository: SportRepository,
  input: CreateSportInput,
): AsyncResult<Sport> {
  if (is_blank_identifier(input.name)) {
    return fail_with_message(
      {
        log_scope: SPORT_USE_CASES_LOG_SCOPE,
        event: SportUseCaseEvent.CREATE_NAME_MISSING,
        context: {},
        user_message: SportUseCaseMessage.NAME_REQUIRED,
      },
      UseCaseErrorCode.VALIDATION_FAILED,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

async function update_sport(
  repository: SportRepository,
  id: SportId,
  input: UpdateSportInput,
): AsyncResult<Sport> {
  if (is_blank_identifier(id)) {
    return fail_missing_sport_id(SportUseCaseEvent.UPDATE_ID_MISSING);
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { sport_id: id },
  });
}

async function delete_sport(
  repository: SportRepository,
  id: SportId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_sport_id(SportUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { sport_id: id },
  });
}

async function delete_sports(
  repository: SportRepository,
  ids: SportId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_identifier({
      log_scope: SPORT_USE_CASES_LOG_SCOPE,
      event: SportUseCaseEvent.DELETE_MANY_IDS_MISSING,
      context: {},
      user_message: SportUseCaseMessage.AT_LEAST_ONE_ID_REQUIRED,
    });
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    log_scope: SPORT_USE_CASES_LOG_SCOPE,
    event: SportUseCaseEvent.DELETE_MANY_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { sport_ids: ids },
    user_message: SportUseCaseMessage.DELETE_MANY_FAILED,
  });
}

export function create_sport_use_cases(
  repository: SportRepository,
): SportUseCases {
  return {
    list: (filter?: SportFilter, options?: QueryOptions) =>
      list_sports(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_sport_by_id(repository, id),
    create: (input) => create_sport(repository, input),
    update: (id, input) => update_sport(repository, id, input),
    delete: (id) => delete_sport(repository, id),
    delete_sports: (ids) => delete_sports(repository, ids),
  };
}
