import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IdentificationTypeRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_identification_type_use_cases,
  type IdentificationTypeUseCases,
} from "./IdentificationTypeUseCases";
import { create_mock_repository } from "./IdentificationTypeUseCases.test_support";

describe("IdentificationTypeUseCases failure logging", () => {
  let mock_repository: IdentificationTypeRepository;
  let use_cases: IdentificationTypeUseCases;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_identification_type_use_cases(mock_repository);
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
    const result = await use_cases.delete("type-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[IdentificationTypeUseCases]", {
      event: "identification_type_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      identification_type_id: "type-123",
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
      error: "Identification type not found",
    });
    expect(console.error).toHaveBeenCalledWith("[IdentificationTypeUseCases]", {
      event: "identification_type_update_target_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'missing-404' not found",
      identification_type_id: "missing-404",
    });
  });

  it("logs a missing identifier with a stable event", async () => {
    const result = await use_cases.get_by_id("");
    expect(result.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith("[IdentificationTypeUseCases]", {
      event: "identification_type_get_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
