import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  create_fake_convex_context,
  find_table_rows,
  get_registered_function_visibility,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import { seed_permissions } from "./seed_permissions";

describe("seed_permissions", () => {
  it("reseeds permission and menu tables", async () => {
    const context = create_fake_convex_context({
      identity: ANONYMOUS_IDENTITY,
      tables: { role_permissions: [{ role: "stale" }] },
    });
    const result = await invoke_convex_handler<{
      success: boolean;
      role_permissions_seeded: number;
    }>(seed_permissions, context, {});
    expect(result.success).toBe(true);
    expect(result.role_permissions_seeded).toBeGreaterThan(0);
    expect(
      find_table_rows(context, "role_permissions").some(
        (row) => row.role === "stale",
      ),
    ).toBe(false);
  });

  it("is not callable from clients", () => {
    expect(get_registered_function_visibility(seed_permissions)).toEqual({
      is_public: false,
      is_internal: true,
    });
  });
});
