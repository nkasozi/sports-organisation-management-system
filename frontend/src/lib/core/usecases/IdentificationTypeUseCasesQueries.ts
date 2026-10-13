import type { IdentificationType } from "$lib/core/entities/IdentificationType";
import type {
  IdentificationTypeFilter,
  IdentificationTypeRepository,
  IdentificationTypeUseCasesPort,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { EntityId, ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  IDENTIFICATION_TYPE_DEFAULT_QUERY_OPTIONS,
  IDENTIFICATION_TYPE_LIST_ALL_QUERY_OPTIONS,
  IdentificationTypeUseCaseEvent,
  IdentificationTypeUseCaseMessage,
} from "./IdentificationTypeUseCasesConstants";
import {
  fail_missing_identification_type_identifier,
  forward_identification_type_result,
} from "./IdentificationTypeUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type IdentificationTypeQueryMethods = Pick<
  IdentificationTypeUseCasesPort,
  "get_by_id" | "list" | "list_all" | "list_types_by_sport"
>;

async function get_identification_type_by_id(
  repository: IdentificationTypeRepository,
  id: ScalarValueInput<IdentificationType["id"]>,
): AsyncResult<IdentificationType> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_type_identifier(
      IdentificationTypeUseCaseEvent.GET_ID_MISSING,
    );
  }
  return forward_identification_type_result(await repository.find_by_id(id), {
    event: IdentificationTypeUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { identification_type_id: id },
  });
}

function build_identification_type_filter(
  filter: IdentificationTypeFilter | Record<string, string> | undefined,
): IdentificationTypeFilter {
  if (!filter?.status) {
    return {};
  }
  return { status: filter.status as IdentificationType["status"] };
}

async function list_identification_types(
  repository: IdentificationTypeRepository,
  filter: IdentificationTypeFilter,
  options: QueryOptions,
): PaginatedAsyncResult<IdentificationType> {
  return forward_identification_type_result(
    await repository.find_all(filter, options),
    { event: IdentificationTypeUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function list_identification_types_by_sport(
  repository: IdentificationTypeRepository,
  sport_id: ScalarValueInput<EntityId>,
): PaginatedAsyncResult<IdentificationType> {
  if (is_blank_identifier(sport_id)) {
    return fail_missing_identification_type_identifier(
      IdentificationTypeUseCaseEvent.LIST_BY_SPORT_ID_MISSING,
      IdentificationTypeUseCaseMessage.SPORT_ID_REQUIRED,
    );
  }
  return forward_identification_type_result(
    await repository.find_all({}, IDENTIFICATION_TYPE_LIST_ALL_QUERY_OPTIONS),
    {
      event: IdentificationTypeUseCaseEvent.LIST_BY_SPORT_FAILED,
      context: { sport_id },
    },
  );
}

export function create_identification_type_queries(
  repository: IdentificationTypeRepository,
): IdentificationTypeQueryMethods {
  return {
    get_by_id: (id) => get_identification_type_by_id(repository, id),
    list: (filter, options) =>
      list_identification_types(
        repository,
        build_identification_type_filter(filter),
        options || IDENTIFICATION_TYPE_DEFAULT_QUERY_OPTIONS,
      ),
    list_all: () =>
      list_identification_types(
        repository,
        {},
        IDENTIFICATION_TYPE_LIST_ALL_QUERY_OPTIONS,
      ),
    list_types_by_sport: (sport_id) =>
      list_identification_types_by_sport(repository, sport_id),
  };
}
