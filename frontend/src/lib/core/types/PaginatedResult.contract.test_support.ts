import type { PaginatedResult } from "./Result";

function make_paginated_result<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: 100,
    total_pages: 1,
  } as PaginatedResult<T>;
}

export function make_paginated_success<T>(items: T[]): {
  success: true;
  data: PaginatedResult<T>;
} {
  return { success: true as const, data: make_paginated_result(items) };
}
