import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedResult } from "../../core/types/Result";

export function format_repository_error(
  error: unknown,
  operation: string,
): string {
  const error_message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return `Failed to ${operation}: ${error_message}`;
}

export function create_paginated_result_from_options<
  TEntity extends BaseEntity,
>(
  items: TEntity[],
  total_count: number,
  options?: QueryOptions,
): PaginatedResult<TEntity> {
  const page_size = options?.page_size ?? 20;
  const page_number = options?.page_number ?? 1;
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
  const direction_multiplier = options.sort_direction === "desc" ? -1 : 1;
  result.sort((a, b) => {
    const value_a = a[sort_field];
    const value_b = b[sort_field];
    if (typeof value_a === "string" && typeof value_b === "string") {
      return value_a.localeCompare(value_b) * direction_multiplier;
    }
    if (value_a < value_b) return -1 * direction_multiplier;
    if (value_a > value_b) return 1 * direction_multiplier;
    return 0;
  });
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
