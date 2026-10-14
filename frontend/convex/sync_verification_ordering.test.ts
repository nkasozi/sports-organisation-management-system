import { describe, expect, it } from "vitest";

import {
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  type BatchResult,
  create_scoped_write_context,
  find_rows,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

const IDENTIFICATIONS_TABLE = "identifications";

function verify_identification(context: FakeConvexContext): boolean {
  const row = find_table_rows(context, IDENTIFICATIONS_TABLE).find(
    (candidate) => candidate.local_id === "id_a",
  );
  if (!row) return false;
  Object.assign(row, {
    is_verified: true,
    identifier_value: "P123",
    version: 2,
  });
  return true;
}

async function push_identification(
  context: FakeConvexContext,
  data: Record<string, unknown>,
  base_version: number,
): Promise<BatchResult["results"][number]> {
  const result = await invoke_convex_handler<BatchResult>(
    batch_upsert,
    context,
    {
      table_name: IDENTIFICATIONS_TABLE,
      records: [
        {
          local_id: "id_a",
          data,
          version: base_version,
          base_version: { kind: "known", version: base_version },
        },
      ],
    },
  );
  return result.results[0];
}

describe("identification verification ordering", () => {
  it("reports a conflict for a stale offline edit made before an admin verified the record", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    verify_identification(context);
    const outcome = await push_identification(
      context,
      { holder_type: "player", holder_id: "player_a", is_verified: false },
      1,
    );
    expect(outcome.action).toBe("conflict_detected");
  });

  it("resets verification when a non-verifier changes an identity field of a verified record", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    verify_identification(context);
    const outcome = await push_identification(
      context,
      {
        holder_type: "player",
        holder_id: "player_a",
        identifier_value: "P999",
        is_verified: true,
      },
      2,
    );
    expect(outcome.success).toBe(true);
    const stored = find_rows(context, IDENTIFICATIONS_TABLE, "id_a")[0];
    expect(stored.identifier_value).toBe("P999");
    expect(stored.is_verified).toBe(false);
  });

  it("keeps verification when a non-verifier edits only non-identity fields", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    verify_identification(context);
    const outcome = await push_identification(
      context,
      { holder_type: "player", holder_id: "player_a", notes: "renewed" },
      2,
    );
    expect(outcome.success).toBe(true);
    expect(
      find_rows(context, IDENTIFICATIONS_TABLE, "id_a")[0].is_verified,
    ).toBe(true);
  });

  it("keeps verification when an administrator changes an identity field", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    verify_identification(context);
    await push_identification(
      context,
      { holder_type: "player", holder_id: "player_a", identifier_value: "P5" },
      2,
    );
    expect(
      find_rows(context, IDENTIFICATIONS_TABLE, "id_a")[0].is_verified,
    ).toBe(true);
  });

  it("still rejects a non-verifier marking a record as verified", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    const outcome = await push_identification(
      context,
      { holder_type: "player", holder_id: "player_a", is_verified: true },
      1,
    );
    expect(outcome.success).toBe(false);
    expect(outcome.action).toBe("rejected_verification_change");
  });
});
