import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SportRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_sport_use_cases } from "./SportUseCases";
import {
  create_mock_repository,
  create_valid_input,
} from "./SportUseCases.test_support";

describe("SportUseCases failure logging", () => {
  let mock_repository: SportRepository;
  let use_cases: ReturnType<typeof create_sport_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_sport_use_cases(mock_repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const result = await use_cases.delete("sport-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[SportUseCases]", {
      event: "sport_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      sport_id: "sport-123",
    });
  });

  it("logs a missing identifier with the existing message", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await use_cases.get_by_id("  ");
    expect(result).toEqual({ success: false, error: "Sport ID is required" });
    expect(error_spy).toHaveBeenCalledWith("[SportUseCases]", {
      event: "sport_get_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });

  it("keeps the bulk delete message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
      success: false,
      error: "disk full",
    });
    const result = await use_cases.delete_sports(["sport-1", "sport-2"]);
    expect(result).toEqual({
      success: false,
      error: "Failed to delete sports",
    });
    expect(error_spy).toHaveBeenCalledWith("[SportUseCases]", {
      event: "sport_delete_many_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "disk full",
      sport_ids: ["sport-1", "sport-2"],
    });
  });

  it("logs a missing sport name as a validation failure", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await use_cases.create(create_valid_input({ name: " " }));
    expect(result).toEqual({ success: false, error: "Sport name is required" });
    expect(error_spy).toHaveBeenCalledWith("[SportUseCases]", {
      event: "sport_create_name_missing",
      error_code: UseCaseErrorCode.VALIDATION_FAILED,
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });
});
