import { describe, expect, it, vi } from "vitest";

import {
  build_resolution_notice,
  ResolutionNoticeStatus,
  resolve_conflicts_in_order,
} from "./conflictStoreResolutionFlow";
import { create_pending_team_conflict } from "./syncStore.test_support";

const RESOLVED = { status: "resolved" } as const;
const NEEDS_ATTENTION = {
  status: "needs_attention",
  message: "Check your connection and try again.",
} as const;

describe("resolve_conflicts_in_order", () => {
  it("resolves every conflict and reports success", async () => {
    const resolve = vi.fn(async () => RESOLVED);

    const feedback = await resolve_conflicts_in_order(
      resolve,
      [create_pending_team_conflict("a"), create_pending_team_conflict("b")],
      "keep_local",
    );

    expect(feedback).toEqual(RESOLVED);
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it("stops at the first conflict that still needs attention", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValueOnce(NEEDS_ATTENTION)
      .mockResolvedValueOnce(RESOLVED);

    const feedback = await resolve_conflicts_in_order(
      resolve,
      [create_pending_team_conflict("a"), create_pending_team_conflict("b")],
      "keep_remote",
    );

    expect(feedback).toEqual(NEEDS_ATTENTION);
    expect(resolve).toHaveBeenCalledOnce();
  });
});

describe("build_resolution_notice", () => {
  it("shows the message when a conflict still needs attention", () => {
    expect(build_resolution_notice(NEEDS_ATTENTION)).toEqual({
      status: ResolutionNoticeStatus.SHOWN,
      message: NEEDS_ATTENTION.message,
    });
  });

  it("hides the notice once a conflict is resolved", () => {
    expect(build_resolution_notice(RESOLVED)).toEqual({
      status: ResolutionNoticeStatus.HIDDEN,
    });
  });
});
