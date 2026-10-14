import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  run_with_timeout,
  TIMED_OPERATION_STATUS,
} from "./layoutSessionTimeouts";

describe("run_with_timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the value when the operation settles in time", async () => {
    const pending = run_with_timeout(Promise.resolve(42), 1000);

    await expect(pending).resolves.toEqual({
      status: TIMED_OPERATION_STATUS.COMPLETED,
      value: 42,
    });
  });

  it("reports a timeout when the operation hangs", async () => {
    const pending = run_with_timeout(new Promise<number>(() => {}), 1000);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toEqual({
      status: TIMED_OPERATION_STATUS.TIMED_OUT,
    });
  });

  it("reports a rejection as a failure value instead of throwing", async () => {
    const pending = run_with_timeout(
      Promise.reject(new Error("socket closed")),
      1000,
    );

    await expect(pending).resolves.toEqual({
      status: TIMED_OPERATION_STATUS.FAILED,
      error: "Error: socket closed",
    });
  });
});
