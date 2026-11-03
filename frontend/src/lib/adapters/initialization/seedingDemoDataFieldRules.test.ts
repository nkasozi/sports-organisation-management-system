import { describe, expect, it, vi } from "vitest";

import { find_record_field_errors } from "$convex/shared_field_rules";
import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import { open_real_test_database } from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { create_untracked_write_scope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScopeToken";

import { seed_demo_data } from "./seedingDemoData";

const test_state = vi.hoisted(() => ({
  database: undefined as unknown as SportSyncDatabase,
}));

vi.mock("$lib/adapters/repositories/database", async (import_original) => ({
  ...(await import_original<object>()),
  get_database: () => test_state.database,
}));

async function find_records_breaking_rules(): Promise<string[]> {
  const problems: string[] = [];
  for (const table of test_state.database.tables) {
    for (const record of await table.toArray()) {
      const errors = find_record_field_errors(record, Date.now());
      for (const [field_name, message] of Object.entries(errors))
        problems.push(`${table.name}.${field_name}: ${message}`);
    }
  }
  return problems;
}

describe("the demo and default records", () => {
  it("all pass the same field rules users and the server are held to", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    test_state.database = open_real_test_database();
    const scope = create_untracked_write_scope({
      reason: UntrackedWriteReason.DEMO_SEED,
      scope_id: "field-rules-demo-seed",
      mark_untracked_transaction: (transaction, reason) =>
        sync_change_tracking_gate.mark_untracked_transaction(
          transaction,
          reason,
        ),
    });

    const seeded = await seed_demo_data(scope);

    expect(seeded).toEqual({ success: true, data: true });
    expect(await find_records_breaking_rules()).toEqual([]);
  }, 60_000);
});
