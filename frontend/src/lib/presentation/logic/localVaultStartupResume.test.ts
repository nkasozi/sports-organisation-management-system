import { beforeEach, describe, expect, it, vi } from "vitest";

import { run_local_vault_startup_unlock } from "./localVaultStartupUnlockFlow";

function create_dependencies(
  mode: string,
  resume_result: unknown,
): Record<string, unknown> & {
  vault_service: Record<string, ReturnType<typeof vi.fn>>;
  wait_for_unlock: ReturnType<typeof vi.fn>;
  reset_database: ReturnType<typeof vi.fn>;
} {
  return {
    vault_service: {
      read_status: vi.fn(async () => ({ kind: "locked", mode })),
      unlock_with_device_key: vi.fn(async () => ({
        success: true,
        data: "device",
      })),
      create_device_unlock: vi.fn(),
      activate_pending_vault: vi.fn(),
      resume_unlock_session: vi.fn(async () => resume_result),
    },
    reset_database: vi.fn(async () => true),
    delete_device_backup: vi.fn(async () => ({ status: "deleted" })),
    wait_for_unlock: vi.fn(async () => "unlocked"),
  };
}

describe("run_local_vault_startup_unlock with a recent unlock", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it.each(["passkey", "pin"])(
    "picks up a recent %s unlock without showing the prompt",
    async (mode) => {
      const dependencies = create_dependencies(mode, {
        success: true,
        data: mode,
      });

      const result = await run_local_vault_startup_unlock(
        dependencies as never,
      );

      expect(result).toEqual({ success: true, data: "resumed" });
      expect(dependencies.wait_for_unlock).not.toHaveBeenCalled();
      expect(dependencies.reset_database).not.toHaveBeenCalled();
    },
  );

  it.each(["passkey", "pin"])(
    "shows the %s prompt when the last unlock cannot be picked up",
    async (mode) => {
      const dependencies = create_dependencies(mode, {
        success: false,
        error: "expired",
      });

      const result = await run_local_vault_startup_unlock(
        dependencies as never,
      );

      expect(
        dependencies.vault_service.resume_unlock_session,
      ).toHaveBeenCalled();
      expect(dependencies.wait_for_unlock).toHaveBeenCalledWith(mode, "");
      expect(result).toEqual({ success: true, data: "unlocked" });
    },
  );

  it("never looks for an unlock session for a device vault", async () => {
    const dependencies = create_dependencies("device", {
      success: true,
      data: "device",
    });

    const result = await run_local_vault_startup_unlock(dependencies as never);

    expect(result).toEqual({ success: true, data: "unlocked" });
    expect(
      dependencies.vault_service.resume_unlock_session,
    ).not.toHaveBeenCalled();
  });
});
