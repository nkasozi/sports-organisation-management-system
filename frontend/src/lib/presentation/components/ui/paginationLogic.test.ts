import { describe, expect, it } from "vitest";

import {
  build_visible_page_entries,
  PAGINATION_ENTRY_KIND,
  type PaginationEntry,
} from "./paginationLogic";

function page(number: number): PaginationEntry {
  return { kind: PAGINATION_ENTRY_KIND.PAGE, page_number: number };
}

const ELLIPSIS: PaginationEntry = { kind: PAGINATION_ENTRY_KIND.ELLIPSIS };

describe("build_visible_page_entries", () => {
  it("returns no entries when there are no pages", () => {
    expect(build_visible_page_entries(1, 0)).toEqual([]);
  });

  it("lists every page when there are seven or fewer", () => {
    expect(build_visible_page_entries(3, 5)).toEqual([
      page(1),
      page(2),
      page(3),
      page(4),
      page(5),
    ]);
  });

  it("shows a trailing ellipsis near the start", () => {
    expect(build_visible_page_entries(1, 10)).toEqual([
      page(1),
      page(2),
      ELLIPSIS,
      page(10),
    ]);
  });

  it("shows both ellipses in the middle", () => {
    expect(build_visible_page_entries(5, 10)).toEqual([
      page(1),
      ELLIPSIS,
      page(4),
      page(5),
      page(6),
      ELLIPSIS,
      page(10),
    ]);
  });

  it("shows a leading ellipsis near the end", () => {
    expect(build_visible_page_entries(10, 10)).toEqual([
      page(1),
      ELLIPSIS,
      page(9),
      page(10),
    ]);
  });
});
