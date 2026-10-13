import { afterEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_staff_role_use_cases } from "./TeamStaffRoleUseCases";
import { create_mock_repository } from "./TeamStaffRoleUseCases.test_support";

describe("TeamStaffRoleUseCases failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.delete_by_id).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const use_cases = create_team_staff_role_use_cases(repository);

    const result = await use_cases.delete("role-123");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamStaffRoleUseCases]", {
      event: "team_staff_role_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      team_staff_role_id: "role-123",
    });
  });

  it("keeps the specific message when the update target is missing", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'role-404' not found",
    });
    const use_cases = create_team_staff_role_use_cases(repository);

    const result = await use_cases.update("role-404", { name: "Coach" });

    expect(result).toEqual({ success: false, error: "Staff role not found" });
    expect(repository.update).not.toHaveBeenCalled();
    expect(error_spy).toHaveBeenCalledWith("[TeamStaffRoleUseCases]", {
      event: "team_staff_role_update_target_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'role-404' not found",
      team_staff_role_id: "role-404",
    });
  });
});
