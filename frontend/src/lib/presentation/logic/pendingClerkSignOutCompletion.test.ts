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
  });

  it("does nothing when no offline logout left Clerk signed in", async () => {
    const dependencies = create_dependencies({
      has_pending_clerk_sign_out: vi.fn(async () => false),
    });

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING,
    );
    expect(dependencies.sign_out).not.toHaveBeenCalled();
  });

  it("finishes an offline logout once Clerk is reachable again", async () => {
    const dependencies = create_dependencies();

    await expect(complete_pending_clerk_sign_out(dependencies)).resolves.toBe(
      PENDING_CLERK_SIGN_OUT_OUTCOME.COMPLETED,
    );
    expect(dependencies.sign_out).toHaveBeenCalledTimes(1);
    expect(dependencies.clear_pending_clerk_sign_out).toHaveBeenCalledTimes(1);
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
  });
});
