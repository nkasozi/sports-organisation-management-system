import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fail_use_case,
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "./UseCaseFailure";

const TEST_EVENT = "competition_lookup_failed";

describe("fail_use_case", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a failure carrying the user-safe message for the code", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_use_case({
      code: UseCaseErrorCode.NOT_FOUND,
      event: TEST_EVENT,
      log_scope: "[CompetitionUseCases]",
      context: { competition_id: "competition_1" },
    });
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
    });
  });

  it("prefers an explicit user message over the code default", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_use_case({
      code: UseCaseErrorCode.VALIDATION_FAILED,
      event: TEST_EVENT,
      log_scope: "[CompetitionUseCases]",
      user_message: "Competition name is required",
      context: {},
    });
    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error).toBe(
      "Competition name is required",
    );
  });

  it("logs a structured event with the code, context and technical detail", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_use_case({
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      event: TEST_EVENT,
      log_scope: "[CompetitionUseCases]",
      technical_detail: "repository offline",
      context: { competition_id: "competition_1" },
    });
    expect(result.success).toBe(false);
    expect(error_spy).toHaveBeenCalledWith("[CompetitionUseCases]", {
      event: TEST_EVENT,
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "repository offline",
      competition_id: "competition_1",
    });
  });

  it("defines a non-empty user message for every error code", () => {
    for (const code of Object.values(UseCaseErrorCode)) {
      expect(USE_CASE_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });
});
