import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { run_local_vault_startup_unlock } from "./localVaultStartupUnlockFlow";

const PENDING_KEY = { data_key: new Uint8Array(32), record: {} };

interface StartupTestDependencies {
  vault_service: Record<
    | "read_status"
    | "unlock_with_device_key"
    | "create_device_unlock"
    | "activate_pending_vault"
    | "resume_unlock_session",
    Mock
  >;
  reset_database: Mock;
  delete_device_backup: Mock;
  wait_for_unlock: Mock;
}

function create_dependencies(status: unknown): {
  dependencies: StartupTestDependencies;
  call_order: string[];
} {
  const call_order: string[] = [];
  const track =
    <T>(name: string, value: T) =>
    async (): Promise<T> => {
      call_order.push(name);
      return value;
    };
  const dependencies = {
    vault_service: {
      read_status: vi.fn(track("read_status", status)),
      unlock_with_device_key: vi.fn(
        track("unlock_device", { success: true, data: "device" }),
      ),
      create_device_unlock: vi.fn(
        track("create_device", { success: true, data: PENDING_KEY }),
      ),
      activate_pending_vault: vi.fn(
        track("activate", { success: true, data: "device" }),
      ),
      resume_unlock_session: vi.fn(
        track("resume", { success: false, error: "no session" }),
      ),
    },
    reset_database: vi.fn(track("reset_database", true)),
    delete_device_backup: vi.fn(track("delete_backup", { status: "deleted" })),
    wait_for_unlock: vi.fn(track("wait_for_unlock", "unlocked")),
  };
  return { dependencies, call_order };
}

const FRESH_START_ORDER = [
  "read_status",
  "reset_database",
  "delete_backup",
  "create_device",
  "activate",
];

describe("run_local_vault_startup_unlock", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("wipes old data and creates a device key on a fresh device", async () => {
    const { dependencies, call_order } = create_dependencies({
      kind: "no_vault",
    });

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "started_fresh" });
    expect(call_order).toEqual(FRESH_START_ORDER);
    expect(
      dependencies.vault_service.activate_pending_vault,
    ).toHaveBeenCalledWith(PENDING_KEY);
  });

  it("unlocks a device key silently without prompting", async () => {
    const { dependencies, call_order } = create_dependencies({
      kind: "locked",
      mode: "device",
    });

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "unlocked" });
    expect(call_order).toEqual(["read_status", "unlock_device"]);
  });

  it("starts fresh when the device key can no longer be used", async () => {
    const { dependencies, call_order } = create_dependencies({
      kind: "locked",
      mode: "device",
    });
    dependencies.vault_service.unlock_with_device_key.mockResolvedValueOnce({
      success: false,
      error: "key missing",
    } as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "started_fresh" });
    expect(call_order.slice(1)).toEqual(FRESH_START_ORDER.slice(1));
  });

  it.each(["passkey", "pin"])(
    "waits for the user to unlock a %s vault",
    async (mode) => {
      const { dependencies } = create_dependencies({ kind: "locked", mode });

      const result = await run_local_vault_startup_unlock(
        dependencies as never,
      );

      expect(dependencies.wait_for_unlock).toHaveBeenCalledWith(mode, "");
      expect(result).toEqual({ success: true, data: "unlocked" });
      expect(dependencies.reset_database).not.toHaveBeenCalled();
    },
  );

  it("wipes the device and creates a device key when the user starts over", async () => {
    const { dependencies } = create_dependencies({
      kind: "locked",
      mode: "passkey",
    });
    dependencies.wait_for_unlock.mockResolvedValueOnce("start_over" as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "started_fresh" });
    expect(dependencies.reset_database).toHaveBeenCalledTimes(1);
    expect(dependencies.delete_device_backup).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the data is already unlocked", async () => {
    const { dependencies, call_order } = create_dependencies({
      kind: "unlocked",
      mode: "pin",
    });

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "already_unlocked" });
    expect(call_order).toEqual(["read_status"]);
  });

  it("keeps going when an old backup cannot be removed", async () => {
    const { dependencies } = create_dependencies({ kind: "no_vault" });
    dependencies.delete_device_backup.mockResolvedValueOnce({
      status: "failed",
      error: "locked",
    } as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result.success).toBe(true);
  });

  it("fails without creating a key when the database cannot be wiped", async () => {
    const { dependencies } = create_dependencies({ kind: "no_vault" });
    dependencies.reset_database.mockRejectedValueOnce(new Error("blocked"));

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result.success).toBe(false);
    expect(
      dependencies.vault_service.create_device_unlock,
    ).not.toHaveBeenCalled();
  });

  it("fails when a new device key cannot be created", async () => {
    const { dependencies } = create_dependencies({ kind: "no_vault" });
    dependencies.vault_service.create_device_unlock.mockResolvedValueOnce({
      success: false,
      error: "no crypto",
    } as never);

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: false, error: "no crypto" });
    expect(
      dependencies.vault_service.activate_pending_vault,
    ).not.toHaveBeenCalled();
  });
});
