import { describe, expect, it, vi } from "vitest";

import {
  ROOT_LAYOUT_STARTUP_OUTCOME,
  run_root_layout_startup,
} from "./layoutRootLayoutStartup";
import { create_startup_command } from "./layoutRootLayoutStartup.test_support";

describe("run_root_layout_startup for ended, offline and deferred sessions", () => {
  it("applies the ended-session policy after app init when Clerk confirmed the session ended", async () => {
    const { command, call_order } = create_startup_command({
      is_signed_in: vi.fn(() => false),
      has_session_been_synced: vi.fn(async () => true),
      resolve_current_device_session: vi.fn(async () => ({
        status: "session_ended",
        verified_sync: {
          status: "verified_user",
          session_id: "s",
          user_id: "u",
        },
      })),
    });

    const outcome = await run_root_layout_startup(command as never);

    expect(outcome).toBe(ROOT_LAYOUT_STARTUP_OUTCOME.READY);
    expect(command.session_handlers.session_ended).toHaveBeenCalledTimes(1);
    expect(command.session_handlers.returning_anonymous).not.toHaveBeenCalled();
    expect(command.initialize_app_data).toHaveBeenCalledTimes(1);
    expect(call_order).toContain("init");
  });

  it("restores the verified user offline instead of tearing down when Clerk is unreachable", async () => {
    const { command } = create_startup_command({
      is_signed_in: vi.fn(() => false),
      has_session_been_synced: vi.fn(async () => true),
      resolve_current_device_session: vi.fn(async () => ({
        status: "offline_verified",
        verified_sync: {
          status: "verified_user",
          session_id: "s",
          user_id: "u",
        },
      })),
    });

    const outcome = await run_root_layout_startup(command as never);

    expect(outcome).toBe(ROOT_LAYOUT_STARTUP_OUTCOME.READY);
    expect(command.session_handlers.returning_anonymous).toHaveBeenCalledTimes(
      1,
    );
    expect(command.session_handlers.session_ended).not.toHaveBeenCalled();
  });

  it("finishes a logout that happened offline instead of pulling the account again", async () => {
    const { command } = create_startup_command({
      complete_pending_clerk_sign_out: vi.fn(async () => "completed"),
    });

    const outcome = await run_root_layout_startup(command as never);

    expect(outcome).toBe(ROOT_LAYOUT_STARTUP_OUTCOME.READY);
    expect(command.session_handlers.login_sync).not.toHaveBeenCalled();
    expect(command.session_handlers.returning_anonymous).toHaveBeenCalledTimes(
      1,
    );
  });
});
