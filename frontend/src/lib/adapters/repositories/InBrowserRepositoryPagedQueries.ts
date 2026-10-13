import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  PaginatedAsyncResult,
  PaginatedResult,
  Result,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_paginated_result_from_options,
  paginate_entity_slice,
} from "./InBrowserBaseRepositoryHelpers";
import {
  execute_repository_operation,
  type RepositoryFailureDetails,
} from "./InBrowserRepositoryQueryRunner";

export interface PagePagination {
  page: number;
  page_size: number;
}

export function convert_page_pagination_to_query_options(
  pagination?: PagePagination,
): QueryOptions {
  return pagination
    ? { page_number: pagination.page, page_size: pagination.page_size }
    : {};
}

export function map_paginated_items<TEntity, TData>(
  result: Result<PaginatedResult<TEntity>>,
  transform: (items: TEntity[]) => TData,
): Result<TData> {
  if (!result.success) return create_failure_result(result.error);
  return create_success_result(transform(result.data.items));
}

export function select_first_paginated_item<TEntity>(
  result: Result<PaginatedResult<TEntity>>,
  not_found_message: string,
): Result<TEntity> {
  if (!result.success) return create_failure_result(result.error);
  if (result.data.items.length === 0) {
    return create_failure_result(not_found_message);
  }
  return create_success_result(result.data.items[0]);
}

export interface CustomOrderQuery<TEntity extends BaseEntity, TFilter> {
  table: Table<TEntity, string>;
  filter: TFilter;
  apply_filter: (entities: TEntity[], filter: TFilter) => TEntity[];
  order: (entities: TEntity[]) => TEntity[];
  options: QueryOptions;
  failure: RepositoryFailureDetails;
}

export function find_all_entities_in_custom_order<
  TEntity extends BaseEntity,
  TFilter extends object,
>(query: CustomOrderQuery<TEntity, TFilter>): PaginatedAsyncResult<TEntity> {
  return execute_repository_operation(query.failure, async () => {
    const all_entities = await query.table.toArray();
    const filtered_entities =
      Object.keys(query.filter).length > 0
        ? query.apply_filter(all_entities, query.filter)
        : all_entities;
    const ordered_entities = query.order(filtered_entities);
    return create_paginated_result_from_options(
      paginate_entity_slice(ordered_entities, query.options),
      ordered_entities.length,
      query.options,
    );
  });
}
