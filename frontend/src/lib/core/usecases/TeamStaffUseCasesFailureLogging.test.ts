import { afterEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_staff_use_cases } from "./TeamStaffUseCases";
import {
  create_mock_repository,
  create_mock_roles_repository,
} from "./TeamStaffUseCases.test_support";

describe("TeamStaffUseCases failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.find_by_team).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const use_cases = create_team_staff_use_cases(
      repository,
      create_mock_roles_repository(),
    );

    const result = await use_cases.list_staff_by_team("team-123");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamStaffUseCases]", {
      event: "team_staff_list_by_team_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      team_id: "team-123",
    });
  });

  it("logs a role listing failure", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const roles_repository = create_mock_roles_repository();
    vi.mocked(roles_repository.find_all).mockResolvedValue({
      success: false,
      error: "Convex query timed out",
    });
    const use_cases = create_team_staff_use_cases(
      create_mock_repository(),
      roles_repository,
    );

    const result = await use_cases.list_staff_roles();

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamStaffUseCases]", {
      event: "team_staff_list_roles_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Convex query timed out",
    });
  });
});
