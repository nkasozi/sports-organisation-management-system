import { describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  INITIAL_UNAUTHORIZED_SIGN_OUT_STATE,
  run_unauthorized_sign_out,
  UNAUTHORIZED_PAGE_MESSAGES,
  UNAUTHORIZED_SIGN_OUT_STATUS,
} from "./unauthorizedPageState";

const LANDING_PATH = "/";

describe("run_unauthorized_sign_out", () => {
  it("starts idle", () => {
    expect(INITIAL_UNAUTHORIZED_SIGN_OUT_STATE).toEqual({
      status: UNAUTHORIZED_SIGN_OUT_STATUS.IDLE,
    });
  });

  it("tears down the device and lands on the home page", async () => {
    const sign_out = vi.fn(async () => create_success_result(true));
    const states: string[] = [];

    const final_state = await run_unauthorized_sign_out({
      sign_out_and_tear_down_device: sign_out,
      on_state_change: (state) => states.push(state.status),
    });

    expect(sign_out).toHaveBeenCalledWith(LANDING_PATH);
    expect(states).toEqual([UNAUTHORIZED_SIGN_OUT_STATUS.SIGNING_OUT]);
    expect(final_state).toEqual({
      status: UNAUTHORIZED_SIGN_OUT_STATUS.SIGNING_OUT,
    });
  });

  it("returns a friendly failure state without exposing the raw error", async () => {
    const final_state = await run_unauthorized_sign_out({
      sign_out_and_tear_down_device: async () =>
        create_failure_result("clerk_sign_out: network down"),
      on_state_change: () => true,
    });

    expect(final_state).toEqual({
      status: UNAUTHORIZED_SIGN_OUT_STATUS.FAILED,
      message: UNAUTHORIZED_PAGE_MESSAGES.SIGN_OUT_FAILED,
    });
  });
});
