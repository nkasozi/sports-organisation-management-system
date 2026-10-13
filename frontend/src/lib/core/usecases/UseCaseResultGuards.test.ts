import { afterEach, describe, expect, it, vi } from "vitest";

import { create_success_result } from "$lib/core/types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "$lib/core/types/UseCaseFailure";

import {
  fail_missing_identifier,
  fail_validation,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

const TARGET = {
  log_scope: "[TestUseCases]",
  event: "test_event_failed",
  context: { record_id: "record-1" },
};

describe("UseCaseResultGuards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects blank identifiers", () => {
    expect(is_blank_identifier(undefined)).toBe(true);
    expect(is_blank_identifier("   ")).toBe(true);
    expect(is_blank_identifier("record-1")).toBe(false);
  });

  it("fails a missing identifier with the given message and logs the code", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_missing_identifier({
      ...TARGET,
      user_message: "Record ID is required",
    });
    expect(result).toEqual({ success: false, error: "Record ID is required" });
    expect(error_spy).toHaveBeenCalledWith("[TestUseCases]", {
      event: "test_event_failed",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
      record_id: "record-1",
    });
  });

  it("joins validation errors into the user message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_validation(TARGET, ["A is required", "B is invalid"]);
    expect(result).toEqual({
      success: false,
      error: "A is required, B is invalid",
    });
  });

  it("fails with an explicit message and code", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = fail_with_message(
      { ...TARGET, user_message: "Record not found" },
      UseCaseErrorCode.NOT_FOUND,
    );
    expect(result).toEqual({ success: false, error: "Record not found" });
    expect(error_spy).toHaveBeenCalledWith(
      "[TestUseCases]",
      expect.objectContaining({ error_code: UseCaseErrorCode.NOT_FOUND }),
    );
  });

  it("forwards successful dependency results unchanged", () => {
    const result = forward_dependency_result(create_success_result(5), {
      ...TARGET,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    });
    expect(result).toEqual({ success: true, data: 5 });
  });

  it("replaces dependency failures with a user-safe message", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = forward_dependency_result(
      { success: false, error: "IndexedDB transaction aborted" },
      { ...TARGET, code: UseCaseErrorCode.DEPENDENCY_FAILED },
    );
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TestUseCases]", {
      event: "test_event_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      record_id: "record-1",
    });
  });
});
