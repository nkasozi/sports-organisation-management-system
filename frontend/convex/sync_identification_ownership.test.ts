import { describe, expect, it } from "vitest";

import { invoke_convex_handler } from "./lib/fake_convex_context.test_support";
import {
  type BatchResult,
  create_scoped_write_context,
  find_rows,
  KNOWN_V1,
  UNKNOWN,
  upsert_one,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { delete_record } from "./sync_basic_mutations";
import { batch_delete } from "./sync_batch_delete_mutation";

const IDENTIFICATIONS_TABLE = "identifications";

function build_new_identification(holder_id: string): Record<string, unknown> {
  return {
    holder_type: "player",
    holder_id,
    identification_type_id: "type_passport",
    identifier_value: "P123",
  };
}

async function batch_delete_one(
  email: string,
  local_id: string,
): Promise<{
  context: ReturnType<typeof create_scoped_write_context>;
  result: BatchResult;
}> {
  const context = create_scoped_write_context(email);
  const result = await invoke_convex_handler<BatchResult>(
    batch_delete,
    context,
    {
      table_name: IDENTIFICATIONS_TABLE,
      records: [{ local_id, base_version: KNOWN_V1 }],
    },
  );
  return { context, result };
}

describe("player-owned identification creates", () => {
  it("lets a player create an identification for their own player", async () => {
    const { context, outcome } = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      IDENTIFICATIONS_TABLE,
      {
        local_id: "id_new_own",
        data: build_new_identification("player_a"),
        base_version: UNKNOWN,
      },
    );
    expect(outcome.success).toBe(true);
    expect(
      find_rows(context, IDENTIFICATIONS_TABLE, "id_new_own"),
    ).toHaveLength(1);
  });

  it("rejects a player creating an identification for another player", async () => {
    const { context, outcome } = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      IDENTIFICATIONS_TABLE,
      {
        local_id: "id_new_other",
        data: build_new_identification("player_a2"),
        base_version: UNKNOWN,
      },
    );
    expect(outcome.success).toBe(false);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_new_other")).toEqual(
      [],
    );
  });

  it("rejects a player creating an already verified identification", async () => {
    const { outcome } = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      IDENTIFICATIONS_TABLE,
      {
        local_id: "id_new_verified",
        data: { ...build_new_identification("player_a"), is_verified: true },
        base_version: UNKNOWN,
      },
    );
    expect(outcome.success).toBe(false);
  });

  it("rejects a player moving their identification to another player", async () => {
    const { context, outcome } = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      IDENTIFICATIONS_TABLE,
      {
        local_id: "id_a",
        data: { holder_type: "player", holder_id: "player_a2" },
        base_version: KNOWN_V1,
      },
    );
    expect(outcome.success).toBe(false);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_a")[0].holder_id).toBe(
      "player_a",
    );
  });
});

describe("player-owned identification deletes", () => {
  it("lets a player delete their own identification through batch delete", async () => {
    const { context, result } = await batch_delete_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      "id_a",
    );
    expect(result.results.every((entry) => entry.success)).toBe(true);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_a")).toEqual([]);
  });

  it("lets a player delete their own identification through a single delete", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    const result = await invoke_convex_handler<{ success: boolean }>(
      delete_record,
      context,
      { table_name: IDENTIFICATIONS_TABLE, local_id: "id_a" },
    );
    expect(result.success).toBe(true);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_a")).toEqual([]);
  });

  it("rejects a player deleting another player's identification through a single delete", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    const result = await invoke_convex_handler<{ success: boolean }>(
      delete_record,
      context,
      { table_name: IDENTIFICATIONS_TABLE, local_id: "id_a2" },
    );
    expect(result.success).toBe(false);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_a2")).toHaveLength(1);
  });

  it("keeps org admins able to delete any identification", async () => {
    const { context, result } = await batch_delete_one(
      ORGANIZATION_A_ADMIN_EMAIL,
      "id_a2",
    );
    expect(result.results.every((entry) => entry.success)).toBe(true);
    expect(find_rows(context, IDENTIFICATIONS_TABLE, "id_a2")).toEqual([]);
  });
});
