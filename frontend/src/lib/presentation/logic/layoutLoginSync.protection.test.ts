import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import {
  build_found_profile,
  create_login_sync_test_dependencies,
} from "./layoutLoginSync.test_support";

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: vi.fn(() => "Syncing Teams (1/4)"),
  scale_sync_percentage: vi.fn(() => 54),
  should_pull_org_from_server: vi.fn(() => true),
}));

describe("layoutLoginSync local data protection", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("protects the device with a new key before wiping and pulling", async () => {
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    const call_order: string[] = [];
    dependencies.look_up_current_user_profile.mockResolvedValueOnce(
      build_found_profile({ email: "coach@example.com" }),
    );
    dependencies.protect_local_data_for_sign_in.mockImplementationOnce(
      async () => {
        call_order.push("protect");
        return { kind: "protected", pending: { data_key: "new-key" } };
      },
    );
    dependencies.reset_database.mockImplementationOnce(async () => {
      call_order.push("reset");
    });
    dependencies.activate_local_vault.mockImplementationOnce(async () => {
      call_order.push("activate");
      return { success: true, data: "passkey" };
    });
    sync_now.mockImplementation(async () => {
      call_order.push("pull");
      return { success: true, errors: [] };
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result).toEqual({ success: true, data: true });
    expect(dependencies.protect_local_data_for_sign_in).toHaveBeenCalledWith(
      "coach@example.com",
    );
    expect(dependencies.activate_local_vault).toHaveBeenCalledWith({
      data_key: "new-key",
    });
    expect(call_order.slice(0, 4)).toEqual([
      "protect",
      "reset",
      "activate",
      "pull",
    ]);
  });

  it("uses a generic owner label when the profile has no email", async () => {
    const { dependencies } = create_login_sync_test_dependencies();

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.protect_local_data_for_sign_in).toHaveBeenCalledWith(
      "Sport-Sync user",
    );
  });

  it("signs out without touching local data when the user declines protection", async () => {
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    dependencies.protect_local_data_for_sign_in.mockResolvedValueOnce({
      kind: "sign_out_requested",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
    expect(dependencies.activate_local_vault).not.toHaveBeenCalled();
    expect(sync_now).not.toHaveBeenCalled();
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/",
    );
  });

  it("offers a retry and does not pull when the new key cannot be activated", async () => {
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    dependencies.activate_local_vault.mockResolvedValueOnce({
      success: false,
      error: "storage blocked",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result).toEqual({ success: false, error: "storage blocked" });
    expect(sync_now).not.toHaveBeenCalled();
    expect(
      dependencies.write_convex_user_to_local_dexie,
    ).not.toHaveBeenCalled();
    expect(dependencies.set_pulling_from_remote).toHaveBeenLastCalledWith(
      false,
    );
    expect(dependencies.show_sync_retry).toHaveBeenCalledWith(
      "device_protection_not_saved",
    );
  });
});
