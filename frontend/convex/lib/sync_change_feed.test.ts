import { describe, expect, it } from "vitest";

import {
  clamp_change_page_size,
  DEFAULT_CHANGE_PAGE_SIZE,
  MAX_CHANGE_PAGE_SIZE,
  merge_change_feed_page,
} from "./sync_change_feed";

describe("merge_change_feed_page", () => {
  it("interleaves records and tombstones by change sequence", () => {
    const page = merge_change_feed_page({
      records: [
        { local_id: "a", sync_sequence: 1 },
        { local_id: "c", sync_sequence: 4 },
      ],
      tombstones: [{ local_id: "b", sync_sequence: 2 }],
      page_size: 10,
      after_sequence: 0,
    });
    expect(page.records.map((row) => row.local_id)).toEqual(["a", "c"]);
    expect(page.tombstones.map((row) => row.local_id)).toEqual(["b"]);
    expect(page.next_cursor).toBe(4);
    expect(page.has_more).toBe(false);
  });

  it("stops at the page size and advances the cursor to the last returned change", () => {
    const page = merge_change_feed_page({
      records: [
        { local_id: "a", sync_sequence: 5 },
        { local_id: "c", sync_sequence: 7 },
      ],
      tombstones: [{ local_id: "b", sync_sequence: 6 }],
      page_size: 2,
      after_sequence: 4,
    });
    expect(page.records.map((row) => row.local_id)).toEqual(["a"]);
    expect(page.tombstones.map((row) => row.local_id)).toEqual(["b"]);
    expect(page.next_cursor).toBe(6);
    expect(page.has_more).toBe(true);
  });

  it("keeps the incoming cursor when there are no changes", () => {
    const page = merge_change_feed_page({
      records: [],
      tombstones: [],
      page_size: 5,
      after_sequence: 12,
    });
    expect(page).toEqual({
      records: [],
      tombstones: [],
      next_cursor: 12,
      has_more: false,
    });
  });
});

describe("clamp_change_page_size", () => {
  it("bounds the requested page size", () => {
    expect(clamp_change_page_size(0)).toBe(1);
    expect(clamp_change_page_size(10_000)).toBe(MAX_CHANGE_PAGE_SIZE);
    expect(clamp_change_page_size(Number.NaN)).toBe(DEFAULT_CHANGE_PAGE_SIZE);
  });
});
