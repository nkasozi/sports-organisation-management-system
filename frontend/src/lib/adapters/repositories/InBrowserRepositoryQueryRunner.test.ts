import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_success_result } from "../../core/types/Result";
import { describe_base_operation_failure } from "./InBrowserBaseRepositoryOperations";
import {
  create_warning_failure_details,
  execute_repository_operation,
  REPOSITORY_ERROR_CODE,
  REPOSITORY_LOG_LEVEL,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";

const MESSAGE_DETAILS = create_warning_failure_details(
  "[Test] Failed",
  "test_failed",
  "do work",
);

function reject_with(error: unknown): () => Promise<never> {
  return () => Promise.reject(error);
}

describe("InBrowserRepositoryQueryRunner", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
    error_spy.mockRestore();
  });

  it("passes query results through unchanged", async () => {
    const failure = { success: false as const, error: "not found" };

    expect(
      await run_repository_query(MESSAGE_DETAILS, async () => failure),
    ).toBe(failure);
    expect(
      await run_repository_query(MESSAGE_DETAILS, async () =>
        create_success_result(4),
      ),
    ).toEqual({ success: true, data: 4 });
  });

  it("returns a user-safe message and logs the technical detail", async () => {
    const result = await run_repository_query(
      MESSAGE_DETAILS,
      reject_with(new Error("boom")),
    );

    expect(result).toEqual({ success: false, error: "Failed to do work" });
    expect(warn_spy).toHaveBeenCalledWith("[Test] Failed", {
      event: "test_failed",
      error_code: REPOSITORY_ERROR_CODE.STORAGE_OPERATION_FAILED,
      operation: "do work",
      error: "Error: boom",
    });
  });

  it("never leaks non-Error rejection values to the caller", async () => {
    const result = await run_repository_query(
      MESSAGE_DETAILS,
      reject_with("secret detail"),
    );

    expect(result).toEqual({ success: false, error: "Failed to do work" });
  });

  it("logs at error level with context ids when configured", async () => {
    const details = {
      ...MESSAGE_DETAILS,
      log_level: REPOSITORY_LOG_LEVEL.ERROR,
      context_ids: { team_id: "team_1" },
    };

    const result = await run_repository_query(
      details,
      reject_with(new Error("boom")),
    );

    expect(result).toEqual({ success: false, error: "Failed to do work" });
    expect(error_spy).toHaveBeenCalledWith("[Test] Failed", {
      event: "test_failed",
      error_code: REPOSITORY_ERROR_CODE.STORAGE_OPERATION_FAILED,
      operation: "do work",
      team_id: "team_1",
      error: "Error: boom",
    });
    expect(warn_spy).not.toHaveBeenCalled();
  });

  it("wraps plain operation values in success results", async () => {
    expect(
      await execute_repository_operation(MESSAGE_DETAILS, async () => "ok"),
    ).toEqual({ success: true, data: "ok" });
  });

  it("derives base operation failure details from the operation name", () => {
    expect(describe_base_operation_failure("fetch entity by id")).toEqual({
      log_message: "[Repository] Failed to fetch entity by id",
      event: "repository_fetch_entity_by_id_failed",
      operation: "fetch entity by id",
      log_level: REPOSITORY_LOG_LEVEL.WARN,
      context_ids: {},
    });
  });
});
