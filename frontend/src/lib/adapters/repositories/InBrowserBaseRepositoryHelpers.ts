import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedResult } from "../../core/types/Result";
import { is_string_value } from "../../infrastructure/utils/runtimeTypeGuards";

enum REPOSITORY_SORT_DIRECTION {
  ASC = "asc",
  DESC = "desc",
}

const DEFAULT_PAGE_SIZE = 20;
const FIRST_PAGE_NUMBER = 1;

function compare_sort_values(value_a: unknown, value_b: unknown): number {
  if (is_string_value(value_a) && is_string_value(value_b))
    return value_a.localeCompare(value_b);
  if ((value_a as number) < (value_b as number)) return -1;
  if ((value_a as number) > (value_b as number)) return 1;
  return 0;
}

export function format_repository_error(operation: string): string {
  return `Failed to ${operation}`;
}

export function create_paginated_result_from_options<
  TEntity extends BaseEntity,
>(
  items: TEntity[],
  total_count: number,
  options?: QueryOptions,
): PaginatedResult<TEntity> {
  const page_size = options?.page_size ?? DEFAULT_PAGE_SIZE;
  const page_number = options?.page_number ?? FIRST_PAGE_NUMBER;
  const total_pages = Math.ceil(total_count / page_size);
  return { items, total_count, page_number, page_size, total_pages };
}

export function sort_entities_by_options<TEntity extends BaseEntity>(
  entities: TEntity[],
  options?: QueryOptions,
): TEntity[] {
  if (!options?.sort_by) return entities;
  const result = [...entities];
  const sort_field = options.sort_by as keyof TEntity;
  const direction_multiplier =
    options.sort_direction === REPOSITORY_SORT_DIRECTION.DESC ? -1 : 1;
  result.sort(
    (a, b) =>
      compare_sort_values(a[sort_field], b[sort_field]) * direction_multiplier,
  );
  return result;
}

export function paginate_entity_slice<TEntity extends BaseEntity>(
  entities: TEntity[],
  options?: QueryOptions,
): TEntity[] {
  if (!options?.page_number || !options?.page_size) return entities;
  const start_index = (options.page_number - 1) * options.page_size;
  return entities.slice(start_index, start_index + options.page_size);
}
