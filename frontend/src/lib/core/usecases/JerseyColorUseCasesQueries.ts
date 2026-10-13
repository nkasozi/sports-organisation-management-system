import type {
  JerseyColor,
  JerseyColorHolderType,
} from "$lib/core/entities/JerseyColor";
import type {
  JerseyColorFilter,
  JerseyColorRepository,
  JerseyColorUseCasesPort,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  JERSEY_COLOR_LIST_ALL_QUERY_OPTIONS,
  JerseyColorUseCaseEvent,
  JerseyColorUseCaseMessage,
} from "./JerseyColorUseCasesConstants";
import {
  fail_missing_jersey_color_identifier,
  forward_jersey_color_result,
} from "./JerseyColorUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type JerseyColorQueryMethods = Pick<
  JerseyColorUseCasesPort,
  "list" | "list_by_holder" | "list_all" | "list_jerseys_by_entity"
>;

type HolderId = JerseyColor["holder_id"];

function build_jersey_color_filter(
  filter: JerseyColorFilter | Record<string, string> | undefined,
): JerseyColorFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.holder_type
      ? { holder_type: filter.holder_type as JerseyColorHolderType }
      : {}),
    ...(filter.holder_id
      ? { holder_id: filter.holder_id as JerseyColorFilter["holder_id"] }
      : {}),
    ...(filter.nickname
      ? { nickname: filter.nickname as JerseyColorFilter["nickname"] }
      : {}),
    ...(filter.main_color
      ? { main_color: filter.main_color as JerseyColorFilter["main_color"] }
      : {}),
    ...(filter.status
      ? { status: filter.status as JerseyColorFilter["status"] }
      : {}),
  };
}

async function list_jersey_colors(
  repository: JerseyColorRepository,
  filter: JerseyColorFilter,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<JerseyColor> {
  return forward_jersey_color_result(
    await repository.find_all(filter, options),
    { event: JerseyColorUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function list_jersey_colors_by_holder(
  repository: JerseyColorRepository,
  holder_type: JerseyColorHolderType,
  holder_id: HolderId,
): PaginatedAsyncResult<JerseyColor> {
  return forward_jersey_color_result(
    await repository.find_by_holder(holder_type, holder_id),
    {
      event: JerseyColorUseCaseEvent.LIST_BY_HOLDER_FAILED,
      context: { holder_type, holder_id },
    },
  );
}

async function list_jersey_colors_by_entity(
  repository: JerseyColorRepository,
  holder_type: JerseyColorHolderType,
  holder_id: HolderId,
): PaginatedAsyncResult<JerseyColor> {
  if (is_blank_identifier(holder_id)) {
    return fail_missing_jersey_color_identifier(
      JerseyColorUseCaseEvent.LIST_BY_ENTITY_ID_MISSING,
      JerseyColorUseCaseMessage.HOLDER_ID_REQUIRED,
    );
  }
  return list_jersey_colors_by_holder(repository, holder_type, holder_id);
}

export function create_jersey_color_queries(
  repository: JerseyColorRepository,
): JerseyColorQueryMethods {
  return {
    list: (filter, options) =>
      list_jersey_colors(
        repository,
        build_jersey_color_filter(filter),
        options,
      ),
    list_by_holder: (holder_type, holder_id) =>
      list_jersey_colors_by_holder(repository, holder_type, holder_id),
    list_all: () =>
      list_jersey_colors(repository, {}, JERSEY_COLOR_LIST_ALL_QUERY_OPTIONS),
    list_jerseys_by_entity: (holder_type, holder_id) =>
      list_jersey_colors_by_entity(repository, holder_type, holder_id),
  };
}
