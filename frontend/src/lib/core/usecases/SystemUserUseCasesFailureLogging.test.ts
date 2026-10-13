import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "./SystemUserUseCases";
import type { MockRepository } from "./SystemUserUseCases.test_support";
import {
  create_mock_repository,
  create_mock_user,
  create_paginated_result,
  create_valid_user_input,
} from "./SystemUserUseCases.test_support";

describe("SystemUserUseCases failure logging", () => {
  let use_cases: SystemUserUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_system_user_use_cases(mock_repository);
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
    const result = await use_cases.delete("user_1");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[SystemUserUseCases]", {
      event: "system_user_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      user_id: "user_1",
    });
  });

  it("logs a duplicate email as a conflict without the email", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.find_all).mockResolvedValue(
      create_paginated_result([create_mock_user({ id: "user_2" })]),
    );
    const result = await use_cases.update("user_1", {
      email: "test@example.com",
    });
    expect(result).toEqual({
      success: false,
      error: "A user with this email already exists",
    });
    expect(error_spy).toHaveBeenCalledWith("[SystemUserUseCases]", {
      event: "system_user_update_email_taken",
      error_code: UseCaseErrorCode.CONFLICT,
      user_id: "user_1",
    });
    expect(mock_repository.update).not.toHaveBeenCalled();
  });

  it("stops creation when the duplicate-email check cannot load users", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.find_all).mockResolvedValue({
      success: false,
      error: "storage unavailable",
    });
    const result = await use_cases.create(create_valid_user_input());
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[SystemUserUseCases]", {
      event: "system_user_create_email_check_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "storage unavailable",
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });

  it("logs an unknown email lookup as not found", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.find_all).mockResolvedValue(
      create_paginated_result([]),
    );
    const result = await use_cases.get_by_email("ghost@example.com");
    expect(result).toEqual({
      success: false,
      error: "User with email 'ghost@example.com' not found",
    });
    expect(error_spy).toHaveBeenCalledWith("[SystemUserUseCases]", {
      event: "system_user_get_by_email_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
    });
  });
});
