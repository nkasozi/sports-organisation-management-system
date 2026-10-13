import { afterEach, describe, expect, it, vi } from "vitest";

import { create_failure_result, create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

const log_target = create_log_target_builder("[TestScope]");

describe("FailureRelay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats empty and whitespace identifiers as blank", () => {
    expect(is_blank_identifier("")).toBe(true);
    expect(is_blank_identifier("   ")).toBe(true);
    expect(is_blank_identifier(undefined)).toBe(true);
    expect(is_blank_identifier("id-1")).toBe(false);
  });

  it("logs a missing identifier with its event and keeps the message", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = fail_missing_identifier(
      log_target("thing_id_missing", { operation: "get" }),
      "Thing ID is required",
    );

    expect(result).toEqual({ success: false, error: "Thing ID is required" });
    expect(error_spy).toHaveBeenCalledWith("[TestScope]", {
      event: "thing_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
      operation: "get",
    });
  });

  it("passes successful repository results through untouched", async () => {
    const result = await relay_repository_result(
      Promise.resolve(create_success_result(7)),
      log_target("thing_lookup_failed"),
    );

    expect(result).toEqual(create_success_result(7));
  });

  it("logs repository failures with the technical detail", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await relay_repository_result(
      Promise.resolve(create_failure_result("Failed to load thing")),
      log_target("thing_lookup_failed", { thing_id: "t1" }),
    );

    expect(result).toEqual(create_failure_result("Failed to load thing"));
    expect(error_spy).toHaveBeenCalledWith("[TestScope]", {
      event: "thing_lookup_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Failed to load thing",
      thing_id: "t1",
    });
  });
});
