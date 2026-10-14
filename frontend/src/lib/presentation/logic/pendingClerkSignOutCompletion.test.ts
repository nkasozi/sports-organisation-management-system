import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  complete_pending_clerk_sign_out,
  PENDING_CLERK_SIGN_OUT_OUTCOME,
  type PendingClerkSignOutDependencies,
} from "./pendingClerkSignOutCompletion";

function create_dependencies(
  overrides: Partial<PendingClerkSignOutDependencies> = {},
): PendingClerkSignOutDependencies {
  return {
    has_pending_clerk_sign_out: vi.fn(async () => true),
    suppress_clerk_session: vi.fn(() => true),
    release_clerk_session_gate: vi.fn(() => true),
    initialize_clerk: vi.fn(async () => true),
    is_clerk_reachable: vi.fn(() => true),
    sign_out: vi.fn(async () => ({
      success: true as const,
      data: true as const,
    })),
    clear_pending_clerk_sign_out: vi.fn(async () => true),
    ...overrides,
  };
}

describe("complete_pending_clerk_sign_out", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("does nothing when no offline logout left Clerk signed in", async () => {
    const dependencies = create_dependencies({
      has_pending_clerk_sign_out: vi.fn(async () => false),
    });

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING,
    );
    expect(dependencies.sign_out).not.toHaveBeenCalled();
    expect(dependencies.suppress_clerk_session).not.toHaveBeenCalled();
  });

  it("hides the Clerk session before Clerk is even contacted", async () => {
    const call_order: string[] = [];
    const dependencies = create_dependencies({
      suppress_clerk_session: vi.fn(() => {
        call_order.push("suppress");
        return true;
      }),
      initialize_clerk: vi.fn(async () => {
        call_order.push("initialize");
        return true;
      }),
    });

    await complete_pending_clerk_sign_out(dependencies);

    expect(call_order).toEqual(["suppress", "initialize"]);
  });

  it("finishes an offline logout once Clerk is reachable again", async () => {
    const dependencies = create_dependencies();

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.COMPLETED,
    );
    expect(dependencies.sign_out).toHaveBeenCalledTimes(1);
    expect(dependencies.clear_pending_clerk_sign_out).toHaveBeenCalledTimes(1);
    expect(dependencies.release_clerk_session_gate).toHaveBeenCalledTimes(1);
  });

  it("stays in signed-out demo mode while Clerk is unreachable", async () => {
    const dependencies = create_dependencies({
      is_clerk_reachable: vi.fn(() => false),
    });

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING,
    );
    expect(dependencies.sign_out).not.toHaveBeenCalled();
    expect(dependencies.release_clerk_session_gate).not.toHaveBeenCalled();
  });

  it("keeps the pending marker when Clerk still refuses the sign-out", async () => {
    const dependencies = create_dependencies({
      sign_out: vi.fn(async () => ({
        success: false as const,
        error: "network",
      })),
    });

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING,
    );
    expect(dependencies.clear_pending_clerk_sign_out).not.toHaveBeenCalled();
    expect(dependencies.release_clerk_session_gate).not.toHaveBeenCalled();
  });

  it("treats an unreadable pending marker as still pending", async () => {
    const dependencies = create_dependencies({
      has_pending_clerk_sign_out: vi.fn(async () => {
        return Promise.reject(new Error("storage closed"));
      }),
    });

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING,
    );
    expect(dependencies.suppress_clerk_session).toHaveBeenCalled();
    expect(dependencies.sign_out).not.toHaveBeenCalled();
  });
});
