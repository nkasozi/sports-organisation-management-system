import { describe, expect, it, vi } from "vitest";

import {
  create_match_report_failed_state,
  MATCH_REPORT_LIVE_POLL_STATUS,
  MATCH_REPORT_PAGE_STATUS,
  stop_match_report_live_poll,
} from "./matchReportPageStatus";

describe("match report page status", () => {
  it("creates a failed state with the user-facing message", () => {
    expect(create_match_report_failed_state("Try again")).toEqual({
      status: MATCH_REPORT_PAGE_STATUS.FAILED,
      message: "Try again",
    });
  });

  it("clears the interval when stopping an active poll", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const interval_id = setInterval(callback, 10) as unknown as ReturnType<
      typeof setInterval
    >;

    const stopped = stop_match_report_live_poll({
      status: MATCH_REPORT_LIVE_POLL_STATUS.ACTIVE,
      interval_id,
    });
    vi.advanceTimersByTime(50);

    expect(stopped).toEqual({ status: MATCH_REPORT_LIVE_POLL_STATUS.STOPPED });
    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("leaves a stopped poll unchanged", () => {
    const stopped_state = {
      status: MATCH_REPORT_LIVE_POLL_STATUS.STOPPED,
    } as const;

    expect(stop_match_report_live_poll(stopped_state)).toBe(stopped_state);
  });
});
