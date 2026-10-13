import type {
  Identification,
  IdentificationHolderType,
} from "$lib/core/entities/Identification";
import type {
  IdentificationFilter,
  IdentificationRepository,
  IdentificationUseCasesPort,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  IDENTIFICATION_DEFAULT_QUERY_OPTIONS,
  IDENTIFICATION_LIST_ALL_QUERY_OPTIONS,
  IdentificationUseCaseEvent,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import {
  fail_missing_identification_identifier,
  forward_identification_result,
} from "./IdentificationUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type IdentificationQueryMethods = Pick<
  IdentificationUseCasesPort,
  "list" | "list_by_holder" | "list_all" | "list_identifications_by_entity"
>;

type HolderId = ScalarValueInput<Identification["holder_id"]>;

function build_identification_filter(
  filter: IdentificationFilter | Record<string, string> | undefined,
): IdentificationFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.holder_type
      ? { holder_type: filter.holder_type as IdentificationHolderType }
      : {}),
    ...(filter.holder_id
      ? { holder_id: filter.holder_id as Identification["holder_id"] }
      : {}),
    ...(filter.identification_type_id
      ? {
          identification_type_id:
            filter.identification_type_id as Identification["identification_type_id"],
        }
      : {}),
    ...(filter.status
      ? { status: filter.status as Identification["status"] }
      : {}),
  };
}

async function list_identifications(
  repository: IdentificationRepository,
  filter: IdentificationFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Identification> {
  return forward_identification_result(
    await repository.find_all(filter, options),
    { event: IdentificationUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function list_identifications_by_holder(
  repository: IdentificationRepository,
  holder_type: IdentificationHolderType,
  holder_id: HolderId,
): PaginatedAsyncResult<Identification> {
  return forward_identification_result(
    await repository.find_by_holder(holder_type, holder_id),
    {
      event: IdentificationUseCaseEvent.LIST_BY_HOLDER_FAILED,
      context: { holder_type, holder_id },
    },
  );
}

async function list_identifications_by_entity(
  repository: IdentificationRepository,
  holder_type: IdentificationHolderType,
  holder_id: HolderId,
): PaginatedAsyncResult<Identification> {
  if (is_blank_identifier(holder_id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.LIST_BY_ENTITY_ID_MISSING,
      IdentificationUseCaseMessage.ENTITY_ID_REQUIRED,
    );
  }
  return list_identifications_by_holder(repository, holder_type, holder_id);
}

export function create_identification_queries(
  repository: IdentificationRepository,
): IdentificationQueryMethods {
  return {
    list: (filter, options) =>
      list_identifications(
        repository,
        build_identification_filter(filter),
        options || IDENTIFICATION_DEFAULT_QUERY_OPTIONS,
      ),
    list_by_holder: (holder_type, holder_id) =>
      list_identifications_by_holder(repository, holder_type, holder_id),
    list_all: () =>
      list_identifications(
        repository,
        {},
        IDENTIFICATION_LIST_ALL_QUERY_OPTIONS,
      ),
    list_identifications_by_entity: (holder_type, holder_id) =>
      list_identifications_by_entity(repository, holder_type, holder_id),
  };
}
