import { describe, expect, it } from "vitest";

import {
  type FakeConvexContext,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  create_scoped_write_context,
  find_rows,
  MANAGER_EMAIL,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

interface StoredRecordResult {
  local_id: string;
  success: boolean;
  action: string;
  server_version: number;
  record: Record<string, unknown>;
}

const KNOWN_V1 = { kind: "known", version: 1 };

async function push_player(
  context: FakeConvexContext,
  record: {
    local_id: string;
    data: Record<string, unknown>;
    base_version: unknown;
    cleared_fields?: string[];
  },
): Promise<StoredRecordResult> {
  const result = await invoke_convex_handler<{
    results: StoredRecordResult[];
  }>(batch_upsert, context, {
    table_name: "players",
    records: [{ ...record, version: 1 }],
  });
  return result.results[0];
}

describe("batch_upsert cleared fields", () => {
  it("removes cleared fields from the stored record on update", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a",
      data: { first_name: "Pat" },
      base_version: KNOWN_V1,
      cleared_fields: ["medical_notes", "phone"],
    });
    expect(outcome.action).toBe("updated");
    const stored = find_rows(context, "players", "player_a")[0];
    expect(stored.medical_notes).toBeUndefined();
    expect(stored.phone).toBeUndefined();
    expect(stored.first_name).toBe("Pat");
  });

  it("treats clearing a stored field as a change even when no other field changed", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a",
      data: {},
      base_version: KNOWN_V1,
      cleared_fields: ["medical_notes"],
    });
    expect(outcome.action).toBe("updated");
  });

  it("ignores protected and unknown cleared fields", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a",
      data: { first_name: "Pat" },
      base_version: KNOWN_V1,
      cleared_fields: ["local_id", "version", "created_at", "not_a_column"],
    });
    expect(outcome.action).toBe("skipped");
    expect(find_rows(context, "players", "player_a")[0].local_id).toBe(
      "player_a",
    );
  });

  it("ignores cleared fields when inserting a new record", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_new",
      data: {
        first_name: "New",
        last_name: "Player",
        organization_id: ORGANIZATION_A_ID,
      },
      base_version: { kind: "unknown" },
      cleared_fields: ["phone"],
    });
    expect(outcome.action).toBe("created");
    expect(find_rows(context, "players", "player_new")[0]).not.toHaveProperty(
      "phone",
    );
  });
});

describe("batch_upsert stored record results", () => {
  it("returns the stored record without convex system fields", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a",
      data: { first_name: "Renamed" },
      base_version: KNOWN_V1,
    });
    expect(outcome.record).toMatchObject({
      local_id: "player_a",
      first_name: "Renamed",
      version: 2,
    });
    expect(outcome.record.sync_sequence).toEqual(expect.any(Number));
    expect(outcome.record).not.toHaveProperty("_id");
  });

  it("returns the stored record for a skipped identical write", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a",
      data: { first_name: "Pat" },
      base_version: KNOWN_V1,
    });
    expect(outcome.action).toBe("skipped");
    expect(outcome.record.local_id).toBe("player_a");
  });

  it("projects the returned record through the caller's read policy", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    const outcome = await push_player(context, {
      local_id: "player_a2",
      data: { first_name: "Pat" },
      base_version: KNOWN_V1,
    });
    expect(outcome.action).toBe("skipped");
    expect(outcome.record).not.toHaveProperty("medical_notes");
  });
});
