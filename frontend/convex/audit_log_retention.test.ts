import { describe, expect, it } from "vitest";

import {
  delete_old_audit_logs_batch,
  get_recent_audit_logs,
  search_audit_logs,
} from "./audit_logs";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const OLD_TIMESTAMP = new Date(
  Date.now() - 90 * DAY_MILLISECONDS,
).toISOString();
const RECENT_TIMESTAMP = new Date().toISOString();

function build_logs(
  count: number,
  timestamp: string,
  prefix: string,
): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_, index) => ({
    local_id: `${prefix}_${index}`,
    organization_id: index % 2 === 0 ? ORGANIZATION_A_ID : ORGANIZATION_B_ID,
    timestamp,
  }));
}

function create_context(
  audit_logs: Array<Record<string, unknown>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, audit_logs },
  });
}

describe("audit log cleanup", () => {
  it("deletes expired logs in index ordered batches and schedules a continuation", async () => {
    const context = create_context([
      ...build_logs(3, OLD_TIMESTAMP, "old"),
      ...build_logs(2, RECENT_TIMESTAMP, "recent"),
    ]);
    const result = await invoke_convex_handler<{
      deleted_count: number;
      has_more: boolean;
    }>(delete_old_audit_logs_batch, context, { batch_size: 2 });
    expect(result).toMatchObject({ deleted_count: 2, has_more: true });
    expect(context.scheduled_calls).toHaveLength(1);
    expect(context.unindexed_collects).toEqual([]);
  });

  it("stops scheduling once every expired log is deleted and keeps recent logs", async () => {
    const context = create_context([
      ...build_logs(2, OLD_TIMESTAMP, "old"),
      ...build_logs(2, RECENT_TIMESTAMP, "recent"),
    ]);
    const result = await invoke_convex_handler<{ has_more: boolean }>(
      delete_old_audit_logs_batch,
      context,
      { batch_size: 5 },
    );
    expect(result.has_more).toBe(false);
    expect(context.scheduled_calls).toEqual([]);
    expect(find_table_rows(context, "audit_logs")).toHaveLength(2);
  });

  it("never deletes logs without a timestamp", async () => {
    const context = create_context([{ local_id: "undated" }]);
    await invoke_convex_handler(delete_old_audit_logs_batch, context, {});
    expect(find_table_rows(context, "audit_logs")).toHaveLength(1);
  });
});

describe("audit log reads use the organization index", () => {
  it("reads an organization's logs without scanning the whole table", async () => {
    const context = create_context(build_logs(4, RECENT_TIMESTAMP, "recent"));
    const recent = await invoke_convex_handler<Array<{ local_id: string }>>(
      get_recent_audit_logs,
      context,
      {},
    );
    expect(recent.map((log) => log.local_id).sort()).toEqual([
      "recent_0",
      "recent_2",
    ]);
    const search = await invoke_convex_handler<{ data: unknown[] }>(
      search_audit_logs,
      context,
      {},
    );
    expect(search.data).toHaveLength(2);
    expect(context.unindexed_collects).toEqual([]);
  });
});
