import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { read_all_record_pages } from "./convexRecordPages";

type QueryCall = { name: string; args: Record<string, unknown> };

const query_calls: QueryCall[] = [];

function build_page(
  local_ids: string[],
  next_cursor: string,
  has_more: boolean,
): Record<string, unknown> {
  return {
    success: true,
    error: "",
    records: local_ids.map((local_id) => ({ local_id, version: 1 })),
    next_cursor,
    has_more,
  };
}

function create_query(
  responses: unknown[],
): (name: string, args: Record<string, unknown>) => Promise<unknown> {
  let index = 0;
  return async (name, args) => {
    query_calls.push({ name, args });
    const response = responses[index];
    index += 1;
    return response;
  };
}

describe("read_all_record_pages", () => {
  beforeEach(() => {
    query_calls.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("follows next_cursor until the server reports no more pages", async () => {
    const result = await read_all_record_pages({
      convex_query: create_query([
        build_page(["a", "b"], "b", true),
        build_page(["c"], "c", false),
      ]),
      table_name: "teams",
      organization_scope: create_some_option("org_1"),
    });

    expect(result.success && result.data.map((row) => row.local_id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(query_calls).toEqual([
      {
        name: "sync:get_records_page",
        args: {
          table_name: "teams",
          organization_id: "org_1",
          after_local_id: "",
          page_size: 200,
        },
      },
      {
        name: "sync:get_records_page",
        args: {
          table_name: "teams",
          organization_id: "org_1",
          after_local_id: "b",
          page_size: 200,
        },
      },
    ]);
  });

  it("omits organization_id when no organization is in scope", async () => {
    const result = await read_all_record_pages({
      convex_query: create_query([build_page([], "", false)]),
      table_name: "sports",
      organization_scope: create_none_option(),
    });

    expect(result).toEqual({ success: true, data: [] });
    expect(query_calls[0].args).toEqual({
      table_name: "sports",
      after_local_id: "",
      page_size: 200,
    });
  });

  it("returns the server error when a page fails", async () => {
    const result = await read_all_record_pages({
      convex_query: create_query([
        {
          success: false,
          error: "Invalid request",
          records: [],
          next_cursor: "",
          has_more: false,
        },
      ]),
      table_name: "teams",
      organization_scope: create_none_option(),
    });

    expect(result).toEqual({ success: false, error: "Invalid request" });
  });

  it("fails on a malformed page instead of treating it as empty", async () => {
    const result = await read_all_record_pages({
      convex_query: create_query([[{ local_id: "legacy" }]]),
      table_name: "teams",
      organization_scope: create_none_option(),
    });

    expect(result.success).toBe(false);
  });

  it("fails when the cursor stops advancing while more pages remain", async () => {
    const result = await read_all_record_pages({
      convex_query: create_query([
        build_page(["a"], "a", true),
        build_page(["a"], "a", true),
      ]),
      table_name: "teams",
      organization_scope: create_none_option(),
    });

    expect(result.success).toBe(false);
    expect(query_calls).toHaveLength(2);
  });

  it("returns a failure when the query rejects", async () => {
    const result = await read_all_record_pages({
      convex_query: async () => Promise.reject(new Error("network down")),
      table_name: "teams",
      organization_scope: create_none_option(),
    });

    expect(result).toEqual({ success: false, error: "network down" });
  });
});
