import { afterEach, describe, expect, it, vi } from "vitest";

import { create_failure_result } from "$lib/core/types/Result";

import { refresh_match_report_fixture_data } from "./matchReportPageLoad";
import {
  MATCH_REPORT_EVENT,
  MATCH_REPORT_MESSAGE,
} from "./matchReportPageMessages";

describe("matchReportPageLoad failures", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a friendly message and logs the raw fixture error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await refresh_match_report_fixture_data({
      fixture_id: "fixture_1",
      dependencies: {
        fixture_use_cases: {
          get_by_id: async () =>
            create_failure_result("IndexedDB: table fixtures missing"),
        },
        fixture_lineup_use_cases: {
          get_lineup_for_team_in_fixture: vi.fn(),
        },
      },
    });

    expect(result).toEqual({
      success: false,
      error: MATCH_REPORT_MESSAGE.FIXTURE_LOAD_FAILED,
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: MATCH_REPORT_EVENT.FIXTURE_LOAD_FAILED,
        fixture_id: "fixture_1",
        error: "IndexedDB: table fixtures missing",
      }),
    );
  });
});
