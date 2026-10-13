import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import {
  handle_user_signed_in_transition,
  SIGNED_IN_TRANSITION_OUTCOME,
} from "./layoutSignedInTransition";

function create_dependencies(
  session_already_synced: boolean,
  pending_sign_out: string = "none_pending",
): {
  complete_pending_clerk_sign_out: () => Promise<never>;
  has_session_been_synced: () => Promise<boolean>;
  resume_verified_session: Mock<() => Promise<boolean>>;
  run_login_sync: Mock<() => Promise<boolean>>;
} {
  return {
    complete_pending_clerk_sign_out: vi.fn(
      async () => pending_sign_out as never,
    ),
    has_session_been_synced: vi.fn(async () => session_already_synced),
    resume_verified_session: vi.fn(async () => true),
    run_login_sync: vi.fn(async () => true),
  };
}

describe("handle_user_signed_in_transition", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("resumes the same verified session without wiping data when Clerk reconnects", async () => {
    const dependencies = create_dependencies(true);

    const outcome = await handle_user_signed_in_transition(dependencies);

    expect(outcome).toBe(SIGNED_IN_TRANSITION_OUTCOME.RESUMED);
    expect(dependencies.resume_verified_session).toHaveBeenCalledTimes(1);
    expect(dependencies.run_login_sync).not.toHaveBeenCalled();
  });

  it("runs the full login sync for a new sign-in", async () => {
    const dependencies = create_dependencies(false);

    const outcome = await handle_user_signed_in_transition(dependencies);

    expect(outcome).toBe(SIGNED_IN_TRANSITION_OUTCOME.LOGIN_SYNC_STARTED);
    expect(dependencies.run_login_sync).toHaveBeenCalledTimes(1);
    expect(dependencies.resume_verified_session).not.toHaveBeenCalled();
  });

  it("finishes an offline logout instead of signing the user back in", async () => {
    const dependencies = create_dependencies(false, "completed");

    const outcome = await handle_user_signed_in_transition(dependencies);

    expect(outcome).toBe(
      SIGNED_IN_TRANSITION_OUTCOME.DEFERRED_SIGN_OUT_FINISHED,
    );
    expect(dependencies.run_login_sync).not.toHaveBeenCalled();
    expect(dependencies.resume_verified_session).not.toHaveBeenCalled();
  });
});
