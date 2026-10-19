import { beforeEach, describe, expect, it, vi } from "vitest";

import { execute_logout_device_teardown } from "./logoutDeviceTeardown";
import {
  create_command,
  LANDING_REQUEST,
} from "./logoutDeviceTeardown.test_support";

describe("execute_logout_device_teardown local data key", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("replaces the signed-in key with a new device key after wiping and before demo seeding", async () => {
    const call_order: string[] = [];

    await execute_logout_device_teardown(
      create_command(call_order),
      LANDING_REQUEST,
    );

    const replace_index = call_order.indexOf("replace_local_data_key");
    expect(replace_index).toBeGreaterThan(
      call_order.indexOf("reset_local_database"),
    );
    expect(replace_index).toBeLessThan(
      call_order.indexOf("seed_signed_out_demo_data"),
    );
  });

  it("stops before demo seeding when a new device key cannot be saved", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, { key_replacement_succeeds: false }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({
      status: "failed",
      failed_step: "replace_local_data_key",
      error: "Key storage blocked",
    });
    expect(call_order).not.toContain("seed_signed_out_demo_data");
    expect(call_order).not.toContain("reload_into:/");
  });
});
