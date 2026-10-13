import type {
  Qualification,
  QualificationHolderType,
} from "$lib/core/entities/Qualification";
import type {
  QualificationFilter,
  QualificationRepository,
  QualificationUseCasesPort,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  QUALIFICATION_DEFAULT_QUERY_OPTIONS,
  QualificationUseCaseEvent,
} from "./QualificationUseCasesConstants";
import { forward_qualification_result } from "./QualificationUseCasesFailures";

type QualificationQueryMethods = Pick<
  QualificationUseCasesPort,
  "list" | "list_by_holder" | "list_all"
>;

function build_qualification_filter(
  filter: QualificationFilter | Record<string, string> | undefined,
): QualificationFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.holder_type
      ? { holder_type: filter.holder_type as QualificationHolderType }
      : {}),
    ...(filter.holder_id
      ? { holder_id: filter.holder_id as Qualification["holder_id"] }
      : {}),
    ...(filter.certification_level
      ? { certification_level: filter.certification_level }
      : {}),
    ...(filter.status
      ? { status: filter.status as Qualification["status"] }
      : {}),
  };
}

async function list_qualifications(
  repository: QualificationRepository,
  filter: QualificationFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Qualification> {
  return forward_qualification_result(
    await repository.find_all(filter, options),
    { event: QualificationUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function list_qualifications_by_holder(
  repository: QualificationRepository,
  holder_type: QualificationHolderType,
  holder_id: Qualification["holder_id"],
): PaginatedAsyncResult<Qualification> {
  return forward_qualification_result(
    await repository.find_by_holder(
      holder_type,
      holder_id,
      QUALIFICATION_DEFAULT_QUERY_OPTIONS,
    ),
    {
      event: QualificationUseCaseEvent.LIST_BY_HOLDER_FAILED,
      context: { holder_type, holder_id },
    },
  );
}

export function create_qualification_queries(
  repository: QualificationRepository,
): QualificationQueryMethods {
  return {
    list: (filter, options) =>
      list_qualifications(
        repository,
        build_qualification_filter(filter),
        options || QUALIFICATION_DEFAULT_QUERY_OPTIONS,
      ),
    list_by_holder: (holder_type, holder_id) =>
      list_qualifications_by_holder(repository, holder_type, holder_id),
    list_all: () =>
      list_qualifications(repository, {}, QUALIFICATION_DEFAULT_QUERY_OPTIONS),
  };
}
