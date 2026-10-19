import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { run_local_vault_startup_unlock } from "./localVaultStartupUnlockFlow";

const PENDING_KEY = { data_key: new Uint8Array(32), record: {} };
const UNREADABLE_MESSAGE =
  "We couldn't open this device's secure storage. Try again.";

interface StartupTestDependencies {
  vault_service: Record<
    | "read_status"
    | "unlock_with_device_key"
    | "create_device_unlock"
    | "activate_pending_vault",
    Mock
  >;
  reset_database: Mock;
  delete_device_backup: Mock;
  wait_for_unlock: Mock;
}

function create_dependencies(): StartupTestDependencies {
  return {
    vault_service: {
      read_status: vi.fn(async () => ({ kind: "unreadable" }) as never),
      unlock_with_device_key: vi.fn(async () => ({
        success: true,
        data: "device",
      })),
      create_device_unlock: vi.fn(async () => ({
        success: true,
        data: PENDING_KEY,
      })),
      activate_pending_vault: vi.fn(async () => ({
        success: true,
        data: "device",
      })),
    },
    reset_database: vi.fn(async () => true),
    delete_device_backup: vi.fn(async () => ({ status: "deleted" })),
    wait_for_unlock: vi.fn(async () => "retry" as never),
  };
}

describe("run_local_vault_startup_unlock with unreadable secure storage", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("never wipes and re-reads the status when the user taps try again", async () => {
    const dependencies = create_dependencies();
    dependencies.vault_service.read_status
      .mockResolvedValueOnce({ kind: "unreadable" } as never)
      .mockResolvedValueOnce({ kind: "locked", mode: "device" } as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(dependencies.wait_for_unlock).toHaveBeenCalledWith(
      "retry_storage",
      UNREADABLE_MESSAGE,
    );
    expect(dependencies.vault_service.read_status).toHaveBeenCalledTimes(2);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: "unlocked" });
  });

  it("keeps asking while the storage stays unreadable", async () => {
    const dependencies = create_dependencies();
    dependencies.vault_service.read_status
      .mockResolvedValueOnce({ kind: "unreadable" } as never)
      .mockResolvedValueOnce({ kind: "unreadable" } as never)
      .mockResolvedValueOnce({ kind: "unlocked", mode: "pin" } as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result.success).toBe(true);
    expect(dependencies.wait_for_unlock).toHaveBeenCalledTimes(2);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
  });

  it("wipes only after the user confirms starting over", async () => {
    const dependencies = create_dependencies();
    dependencies.wait_for_unlock.mockResolvedValueOnce("start_over" as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "started_fresh" });
    expect(dependencies.reset_database).toHaveBeenCalledTimes(1);
  });
});
