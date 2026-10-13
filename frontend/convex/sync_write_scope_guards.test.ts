import { describe, expect, it } from "vitest";

import { invoke_convex_handler } from "./lib/fake_convex_context.test_support";
import {
  type BatchResult,
  create_scoped_write_context,
  find_rows,
  KNOWN_V1,
  OFFICIAL_EMAIL,
  UNKNOWN,
  upsert_one,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_delete } from "./sync_batch_delete_mutation";

describe("per-record create/update permission", () => {
  it("does not let an update-only role create records through batch upsert", async () => {
    const { context, outcome } = await upsert_one(OFFICIAL_EMAIL, "fixtures", {
      local_id: "fixture_new",
      data: { organization_id: ORGANIZATION_A_ID, notes: "new" },
      base_version: UNKNOWN,
    });
    expect(outcome.success).toBe(false);
    expect(find_rows(context, "fixtures", "fixture_new")).toEqual([]);
  });

  it("still lets an update-only role update existing records", async () => {
    const { outcome } = await upsert_one(OFFICIAL_EMAIL, "fixtures", {
      local_id: "fixture_a",
      data: { organization_id: ORGANIZATION_A_ID, notes: "updated" },
      base_version: KNOWN_V1,
    });
    expect(outcome.success).toBe(true);
  });
});

describe("self-scoped deletes", () => {
  it("does not let a player delete identifications", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_PLAYER_EMAIL);
    const result = await invoke_convex_handler<BatchResult>(
      batch_delete,
      context,
      {
        table_name: "identifications",
        records: [{ local_id: "id_a2", base_version: KNOWN_V1 }],
      },
    );
    expect(result.results.every((entry) => !entry.success)).toBe(true);
    expect(find_rows(context, "identifications", "id_a2")).toHaveLength(1);
  });
});
