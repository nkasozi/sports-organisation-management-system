import { describe, expect, it } from "vitest";

import { invoke_convex_handler } from "./lib/fake_convex_context.test_support";
import {
  create_scoped_write_context,
  MANAGER_EMAIL,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_delete } from "./sync_batch_delete_mutation";
import { batch_upsert } from "./sync_batch_mutation";

interface ConflictBatchResult {
  results: Array<{ local_id: string; success: boolean; action: string }>;
  conflicts: Array<{
    local_id: string;
    remote_data: Record<string, unknown>;
    remote_data_status: string;
  }>;
}

const STALE_BASE = { kind: "known", version: 0 };
const PRIVATE_PLAYER_FIELDS = ["email", "phone", "medical_notes"];

async function push_stale_update(
  email: string,
  table_name: string,
  local_id: string,
  data: Record<string, unknown>,
): Promise<ConflictBatchResult> {
  const context = create_scoped_write_context(email);
  return invoke_convex_handler<ConflictBatchResult>(batch_upsert, context, {
    table_name,
    records: [{ local_id, data, version: 1, base_version: STALE_BASE }],
  });
}

describe("batch_upsert conflict payload authorization", () => {
  it("returns the full remote record to a caller allowed to read all of it", async () => {
    const result = await push_stale_update(
      ORGANIZATION_A_ADMIN_EMAIL,
      "players",
      "player_a2",
      { first_name: "Changed" },
    );
    expect(result.conflicts[0].remote_data_status).toBe("visible");
    expect(result.conflicts[0].remote_data.medical_notes).toBe("asthma");
    expect(result.conflicts[0].remote_data._id).toBeUndefined();
  });

  it("projects private fields away for a caller who only sees the public projection", async () => {
    const result = await push_stale_update(
      MANAGER_EMAIL,
      "players",
      "player_a2",
      { first_name: "Changed" },
    );
    expect(result.results[0].action).toBe("conflict_detected");
    const remote_data = result.conflicts[0].remote_data;
    for (const field_name of PRIVATE_PLAYER_FIELDS)
      expect(remote_data[field_name]).toBeUndefined();
    expect(remote_data.first_name).toBe("Pat");
  });

  it("returns the conflict without remote fields when the caller cannot read the record", async () => {
    const result = await push_stale_update(
      ORGANIZATION_A_PLAYER_EMAIL,
      "identifications",
      "id_a2",
      { identifier_value: "STOLEN" },
    );
    expect(result.results[0].action).toBe("conflict_detected");
    expect(result.conflicts[0].remote_data_status).toBe("hidden");
    expect(result.conflicts[0].remote_data).toEqual({});
  });
});

describe("batch_delete conflict payload authorization", () => {
  it("projects the remote record returned with a delete conflict", async () => {
    const context = create_scoped_write_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await invoke_convex_handler<ConflictBatchResult>(
      batch_delete,
      context,
      {
        table_name: "players",
        records: [{ local_id: "player_a2", base_version: STALE_BASE }],
      },
    );
    expect(result.conflicts[0].remote_data.medical_notes).toBe("asthma");
    expect(result.conflicts[0].remote_data._id).toBeUndefined();
  });
});
