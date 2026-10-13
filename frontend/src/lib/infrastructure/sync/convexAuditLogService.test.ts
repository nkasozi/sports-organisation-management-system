import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuditLogFilter } from "$lib/core/interfaces/ports";

import {
  AUDIT_LOG_PAGE_SIZE,
  search_audit_logs_from_convex,
} from "./convexAuditLogService";

const query_calls: Array<{ name: string; args: Record<string, unknown> }> = [];
const client_state = { is_configured: true };

const CONVEX_SEARCH_RESPONSE = {
  success: true,
  data: [
    {
      _id: "convex-1",
      action: "update",
      entity_type: "teams",
      created_at: "2024-01-01T00:00:00.000Z",
    },
  ],
  total_count: 1,
  page_number: 2,
  page_size: 10,
  total_pages: 1,
};

vi.mock("./convexSyncService", () => ({
  get_sync_manager: () => ({
    is_configured: () => client_state.is_configured,
    get_convex_client: () =>
      client_state.is_configured
        ? {
            success: true,
            data: {
              query: async (
                name: string,
                args: Record<string, unknown>,
              ): Promise<unknown> => {
                query_calls.push({ name, args });
                return CONVEX_SEARCH_RESPONSE;
              },
            },
          }
        : { success: false, error: "not configured" },
  }),
}));

describe("search_audit_logs_from_convex", () => {
  beforeEach(() => {
    query_calls.length = 0;
    client_state.is_configured = true;
  });

  it("returns an empty failure result when the client is not configured", async () => {
    client_state.is_configured = false;

    const result = await search_audit_logs_from_convex({} as AuditLogFilter);

    expect(result).toEqual({
      success: false,
      data: [],
      total_count: 0,
      page_number: 1,
      page_size: AUDIT_LOG_PAGE_SIZE,
      total_pages: 0,
      error_message: "Convex client not configured",
    });
    expect(query_calls).toEqual([]);
  });

  it("sends default paging and no filter keys for an empty filter", async () => {
    const search_result = await search_audit_logs_from_convex(
      {} as AuditLogFilter,
    );
    expect(search_result.success).toBe(true);

    expect(query_calls).toEqual([
      {
        name: "audit_logs:search_audit_logs",
        args: { page_number: 1, page_size: AUDIT_LOG_PAGE_SIZE },
      },
    ]);
  });

  it("sends every populated filter and caps the page size", async () => {
    const filter = {
      entity_type: "teams",
      entity_id: "team-1",
      user_id: "user-1",
      action: "update",
      organization_id: "org-1",
      from_date: "2024-01-01",
      to_date: "2024-02-01",
    } as AuditLogFilter;

    const search_result = await search_audit_logs_from_convex(filter, {
      page_number: 3,
      page_size: 500,
    });
    expect(search_result.success).toBe(true);

    expect(query_calls[0].args).toEqual({
      page_number: 3,
      page_size: AUDIT_LOG_PAGE_SIZE,
      ...filter,
    });
  });

  it("transforms returned records and copies paging metadata", async () => {
    const result = await search_audit_logs_from_convex({} as AuditLogFilter, {
      page_size: 10,
    });

    expect(result).toMatchObject({
      success: true,
      total_count: 1,
      page_number: 2,
      page_size: 10,
      total_pages: 1,
    });
    expect(result).not.toHaveProperty("error_message");
    expect(result.data[0]).toMatchObject({
      id: "convex-1",
      action: "update",
      entity_type: "teams",
      timestamp: "2024-01-01T00:00:00.000Z",
      changes: [],
    });
  });
});
