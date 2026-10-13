import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { PaginatedResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  convert_page_pagination_to_query_options,
  type CustomOrderQuery,
  find_all_entities_in_custom_order,
  map_paginated_items,
  select_first_paginated_item,
} from "./InBrowserRepositoryPagedQueries";
import { create_warning_failure_details } from "./InBrowserRepositoryQueryRunner";

type Item = BaseEntity & { rank: number };

const ITEMS: Item[] = [3, 1, 2].map(
  (rank) => ({ id: `i${rank}`, created_at: "", updated_at: "", rank }) as Item,
);

const FAILURE = create_warning_failure_details(
  "[Test] Failed",
  "test_failed",
  "list items",
);

function page_of(items: Item[]): Result<PaginatedResult<Item>> {
  return create_success_result({
    items,
    total_count: items.length,
    page_number: 1,
    page_size: 20,
    total_pages: 1,
  });
}

function create_query(
  filter: { rank?: number },
  table: unknown,
): CustomOrderQuery<Item, { rank?: number }> {
  return {
    table: table as never,
    filter,
    apply_filter: (items: Item[], applied: { rank?: number }) =>
      items.filter((item) => item.rank >= (applied.rank ?? 0)),
    order: (items: Item[]) => [...items].sort((a, b) => a.rank - b.rank),
    options: { page_number: 1, page_size: 2 },
    failure: FAILURE,
  };
}

describe("InBrowserRepositoryPagedQueries", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("converts page pagination to query options", () => {
    expect(
      convert_page_pagination_to_query_options({ page: 3, page_size: 5 }),
    ).toEqual({ page_number: 3, page_size: 5 });
    expect(convert_page_pagination_to_query_options()).toEqual({});
  });

  it("maps paginated items or passes failures through", () => {
    expect(
      map_paginated_items(page_of(ITEMS), (items) => items.length),
    ).toEqual({
      success: true,
      data: 3,
    });
    expect(map_paginated_items(create_failure_result("bad"), () => 0)).toEqual({
      success: false,
      error: "bad",
    });
  });

  it("selects the first paginated item or reports absence", () => {
    expect(select_first_paginated_item(page_of(ITEMS), "none")).toEqual({
      success: true,
      data: ITEMS[0],
    });
    expect(select_first_paginated_item(page_of([]), "none")).toEqual({
      success: false,
      error: "none",
    });
    expect(
      select_first_paginated_item(create_failure_result("bad"), "none"),
    ).toEqual({
      success: false,
      error: "bad",
    });
  });

  it("orders before paginating and skips empty filters", async () => {
    const table = { toArray: vi.fn().mockResolvedValue(ITEMS) };

    const result = await find_all_entities_in_custom_order(
      create_query({}, table),
    );

    expect(result.success && result.data.items.map((item) => item.id)).toEqual([
      "i1",
      "i2",
    ]);
    expect(result.success && result.data.total_count).toBe(3);
  });

  it("applies non-empty filters before ordering", async () => {
    const table = { toArray: vi.fn().mockResolvedValue(ITEMS) };

    const result = await find_all_entities_in_custom_order(
      create_query({ rank: 2 }, table),
    );

    expect(result.success && result.data.items.map((item) => item.id)).toEqual([
      "i2",
      "i3",
    ]);
  });

  it("reports storage failures", async () => {
    const table = { toArray: vi.fn().mockRejectedValue(new Error("down")) };

    expect(
      await find_all_entities_in_custom_order(create_query({}, table)),
    ).toEqual({
      success: false,
      error: "Failed to list items",
    });
  });
});
