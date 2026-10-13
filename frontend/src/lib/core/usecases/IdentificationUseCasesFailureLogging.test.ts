import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IdentificationRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_identification_use_cases,
  type IdentificationUseCases,
} from "./IdentificationUseCases";
import { create_mock_repository } from "./IdentificationUseCases.test_support";

describe("IdentificationUseCases failure logging", () => {
  let mock_repository: IdentificationRepository;
  let use_cases: IdentificationUseCases;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_identification_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const result = await use_cases.delete("id-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[IdentificationUseCases]", {
      event: "identification_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      identification_id: "id-123",
    });
  });

  it("keeps the specific message when the update target is missing", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'missing-404' not found",
    });
    const result = await use_cases.update("missing-404", {});
    expect(result).toEqual({
      success: false,
      error: "Identification not found",
    });
    expect(console.error).toHaveBeenCalledWith("[IdentificationUseCases]", {
      event: "identification_update_target_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'missing-404' not found",
      identification_id: "missing-404",
    });
  });

  it("logs a missing identifier with a stable event", async () => {
    const result = await use_cases.get_by_id("");
    expect(result.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith("[IdentificationUseCases]", {
      event: "identification_get_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
