import { describe, expect, it } from "vitest";

import {
  filter_audit_logs,
  paginate_audit_logs,
  resolve_audit_page_request,
  sort_audit_logs_newest_first,
} from "./audit_log_search";

const LOGS = [
  { entity_type: "team", action: "create", timestamp: "2024-01-02" },
  { entity_type: "team", action: "delete", created_at: "2024-01-05" },
  { entity_type: "player", action: "create", timestamp: "2024-01-03" },
  { entity_type: "team", action: "update" },
];

describe("audit log search", () => {
  it("applies exact criteria and skips empty ones", () => {
    expect(filter_audit_logs(LOGS, { entity_type: "team" })).toHaveLength(3);
    expect(
      filter_audit_logs(LOGS, { entity_type: "team", action: "create" }),
    ).toHaveLength(1);
    expect(filter_audit_logs(LOGS, { action: "" })).toHaveLength(4);
  });

  it("filters by date range using timestamp then created_at, dropping undated logs", () => {
    expect(
      filter_audit_logs(LOGS, { from_date: "2024-01-03" }).map(
        (log) => log.action,
      ),
    ).toEqual(["delete", "create"]);
    expect(filter_audit_logs(LOGS, { to_date: "2024-01-02" })).toHaveLength(1);
  });

  it("sorts newest first and paginates", () => {
    const sorted = sort_audit_logs_newest_first(LOGS);
    expect(sorted.map((log) => log.action)).toEqual([
      "delete",
      "create",
      "create",
      "update",
    ]);
    expect(
      paginate_audit_logs(sorted, { page_number: 2, page_size: 3 }),
    ).toEqual({
      success: true,
      data: [sorted[3]],
      total_count: 4,
      page_number: 2,
      page_size: 3,
      total_pages: 2,
    });
  });
});

describe("resolve_audit_page_request", () => {
  const MAX_PAGE_SIZE = 50;

  it("defaults to the first page at the maximum page size", () => {
    expect(resolve_audit_page_request({}, MAX_PAGE_SIZE)).toEqual({
      success: true,
      data: { page_number: 1, page_size: MAX_PAGE_SIZE },
    });
  });

  it("caps oversized page sizes at the maximum", () => {
    expect(
      resolve_audit_page_request(
        { page_number: 3, page_size: 500 },
        MAX_PAGE_SIZE,
      ),
    ).toEqual({ success: true, data: { page_number: 3, page_size: 50 } });
  });

  it.each([
    { page_number: 0 },
    { page_number: -2 },
    { page_number: 1.5 },
    { page_number: Number.NaN },
    { page_size: 0 },
    { page_size: -10 },
    { page_size: 2.5 },
    { page_size: Number.POSITIVE_INFINITY },
  ])("rejects invalid page request %o", (requested_page) => {
    expect(
      resolve_audit_page_request(requested_page, MAX_PAGE_SIZE).success,
    ).toBe(false);
  });
});
