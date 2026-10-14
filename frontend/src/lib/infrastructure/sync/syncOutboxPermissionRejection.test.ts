import { describe, expect, it } from "vitest";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import {
  PERMISSION_DENIED_REJECTION,
  reject_unpermitted_pending_entries,
} from "./syncOutboxPermissionRejection";
import { build_entry } from "./syncPushService.test_support";
import { role_can_push_operation } from "./syncTableNames";

describe("role_can_push_operation", () => {
  it("allows upserts but not deletes when the role may only create and update", () => {
    expect(role_can_push_operation("team_manager", "teams", "upsert")).toBe(
      true,
    );
    expect(role_can_push_operation("team_manager", "teams", "delete")).toBe(
      false,
    );
  });

  it("allows deletes when the role holds delete permission", () => {
    expect(role_can_push_operation("org_admin", "teams", "delete")).toBe(true);
  });

  it("allows pushes the role may only make on its own records so the server decides ownership", () => {
    expect(role_can_push_operation("player", "identifications", "delete")).toBe(
      true,
    );
    expect(role_can_push_operation("player", "identifications", "upsert")).toBe(
      true,
    );
  });
});

describe("reject_unpermitted_pending_entries", () => {
  it("parks pending changes the role may not push so the unsynced count drains", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry(),
      build_entry({ local_id: "team_b", operation: "delete" }),
      build_entry({ table_name: "sports", local_id: "sport_a" }),
    ]);

    const result = await reject_unpermitted_pending_entries(
      fake.database,
      "team_manager",
      "run_1",
    );

    expect(result.success && result.data.map((item) => item.local_id)).toEqual([
      "team_b",
      "sport_a",
    ]);
    const rows = fake.rows("sync_outbox");
    expect(rows.find((row) => row.local_id === "team_a")).toMatchObject({
      status: "pending",
    });
    expect(rows.find((row) => row.local_id === "team_b")).toMatchObject({
      status: "rejected",
      rejection_code: PERMISSION_DENIED_REJECTION.code,
      rejection_message: PERMISSION_DENIED_REJECTION.message,
    });
    expect(rows.find((row) => row.local_id === "sport_a")).toMatchObject({
      status: "rejected",
    });
  });

  it("leaves already rejected or conflicted entries untouched", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry({
        table_name: "sports",
        status: "conflicted",
        remote_version: 3,
      }),
    ]);

    const result = await reject_unpermitted_pending_entries(
      fake.database,
      "team_manager",
      "run_1",
    );

    expect(result.success && result.data).toEqual([]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({ status: "conflicted" });
  });

  it("requeues changes parked for permission once the role may push them", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry({
        local_id: "team_b",
        operation: "delete",
        status: "rejected",
        rejection_code: PERMISSION_DENIED_REJECTION.code,
        rejection_message: PERMISSION_DENIED_REJECTION.message,
      }),
      build_entry({
        local_id: "team_c",
        status: "rejected",
        rejection_code: "rejected_wrong_organization",
        rejection_message: "Wrong organization",
      }),
    ]);

    const result = await reject_unpermitted_pending_entries(
      fake.database,
      "org_admin",
      "run_1",
    );

    expect(result.success && result.data).toEqual([]);
    const rows = fake.rows("sync_outbox");
    expect(rows.find((row) => row.local_id === "team_b")).toEqual(
      build_entry({ local_id: "team_b", operation: "delete" }),
    );
    expect(rows.find((row) => row.local_id === "team_c")).toMatchObject({
      status: "rejected",
    });
  });
});
