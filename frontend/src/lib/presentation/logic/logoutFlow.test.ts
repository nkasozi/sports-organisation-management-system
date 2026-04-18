import { describe, expect, it, vi } from "vitest";

import { execute_logout_flow } from "./logoutFlow";

describe("logoutFlow", () => {
  function create_command(
    overrides: Partial<Parameters<typeof execute_logout_flow>[0]> = {},
  ) {
    const before_sign_out = vi.fn(async () => {});
    const after_sign_out = vi.fn(async () => {});
    const clear_session_sync_flag = vi.fn(async () => {});
    const sign_out = vi.fn(async () => {});

    return {
      command: {
        after_sign_out,
        before_sign_out,
        clear_session_sync_flag,
        sign_out,
        ...overrides,
      },
      after_sign_out,
      before_sign_out,
      clear_session_sync_flag,
      sign_out,
    };
  }

  it("clears the session sync flag before signing out and redirecting", async () => {
    const call_order: string[] = [];
    const { command } = create_command({
      after_sign_out: vi.fn(async () => {
        call_order.push("after_sign_out");
      }),
      before_sign_out: vi.fn(async () => {
        call_order.push("before_sign_out");
      }),
      clear_session_sync_flag: vi.fn(async () => {
        call_order.push("clear_session_sync_flag");
      }),
      sign_out: vi.fn(async () => {
        call_order.push("sign_out");
      }),
    });

    await expect(execute_logout_flow(command)).resolves.toEqual({
      success: true,
      data: true,
    });
    expect(call_order).toEqual([
      "clear_session_sync_flag",
      "before_sign_out",
      "sign_out",
      "after_sign_out",
    ]);
  });

  it("fails fast when clearing the session sync flag fails", async () => {
    const { after_sign_out, before_sign_out, command, sign_out } =
      create_command({
        clear_session_sync_flag: vi.fn(async () => {
          throw new Error("clear failed");
        }),
      });

    await expect(execute_logout_flow(command)).resolves.toEqual({
      success: false,
      error: "Logout flow failed",
    });
    expect(before_sign_out).not.toHaveBeenCalled();
    expect(sign_out).not.toHaveBeenCalled();
    expect(after_sign_out).not.toHaveBeenCalled();
  });

  it("fails fast when sign out fails", async () => {
    const {
      after_sign_out,
      before_sign_out,
      clear_session_sync_flag,
      command,
    } = create_command({
      sign_out: vi.fn(async () => {
        throw new Error("sign out failed");
      }),
    });

    await expect(execute_logout_flow(command)).resolves.toEqual({
      success: false,
      error: "Logout flow failed",
    });
    expect(clear_session_sync_flag).toHaveBeenCalledOnce();
    expect(before_sign_out).toHaveBeenCalledOnce();
    expect(after_sign_out).not.toHaveBeenCalled();
  });
});
