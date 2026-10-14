import { describe, expect, it } from "vitest";

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
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

interface BatchResult {
  success: boolean;
  results: Array<{ local_id: string; success: boolean; action: string }>;
}

const NEW_USER_LOCAL_ID = "user_new_a";
const MIXED_CASE_EMAIL = "  New.Person@Example.COM ";
const NORMALIZED_EMAIL = "new.person@example.com";

function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS },
  });
}

async function upsert_user(
  context: FakeConvexContext,
  local_id: string,
  email: string,
): Promise<BatchResult> {
  return invoke_convex_handler<BatchResult>(batch_upsert, context, {
    table_name: "system_users",
    records: [
      {
        local_id,
        data: {
          email,
          role: "player",
          organization_id: ORGANIZATION_A_ID,
          first_name: "New",
          last_name: "Person",
        },
        version: 1,
      },
    ],
  });
}

describe("system user email normalization", () => {
  it("stores a trimmed lowercase email when a system user is created", async () => {
    const context = create_context();
    const result = await upsert_user(
      context,
      NEW_USER_LOCAL_ID,
      MIXED_CASE_EMAIL,
    );
    expect(result.results[0].success).toBe(true);
    const stored = find_table_rows(context, "system_users").find(
      (row) => row.local_id === NEW_USER_LOCAL_ID,
    );
    expect(stored?.email).toBe(NORMALIZED_EMAIL);
  });

  it("rejects a second account whose email differs only by case or spacing", async () => {
    const context = create_context();
    await upsert_user(context, NEW_USER_LOCAL_ID, NORMALIZED_EMAIL);
    const duplicate = await upsert_user(
      context,
      "user_duplicate_a",
      MIXED_CASE_EMAIL,
    );
    expect(duplicate.results[0].success).toBe(false);
  });

  it("normalizes the email when an existing system user is updated", async () => {
    const context = create_context();
    await upsert_user(context, NEW_USER_LOCAL_ID, NORMALIZED_EMAIL);
    await invoke_convex_handler<BatchResult>(batch_upsert, context, {
      table_name: "system_users",
      records: [
        {
          local_id: NEW_USER_LOCAL_ID,
          data: { email: MIXED_CASE_EMAIL, first_name: "Renamed" },
          version: 1,
          base_version: { kind: "known", version: 1 },
        },
      ],
    });
    const stored = find_table_rows(context, "system_users").find(
      (row) => row.local_id === NEW_USER_LOCAL_ID,
    );
    expect(stored?.first_name).toBe("Renamed");
    expect(stored?.email).toBe(NORMALIZED_EMAIL);
  });
});
