import { afterEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_use_cases } from "./TeamUseCases";
import { create_mock_repository } from "./TeamUseCases.test_support";

describe("TeamUseCases failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.find_by_organization).mockResolvedValue({
      success: false,
      error: "Convex query timed out",
    });
    const use_cases = create_team_use_cases(repository);

    const result = await use_cases.list_teams_by_organization("org-123");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamUseCases]", {
      event: "team_list_by_organization_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Convex query timed out",
      organization_id: "org-123",
    });
  });

  it("logs a lookup failure as not found", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'team-404' not found",
    });
    const use_cases = create_team_use_cases(repository);

    const result = await use_cases.get_by_id("team-404");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamUseCases]", {
      event: "team_get_failed",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'team-404' not found",
      team_id: "team-404",
    });
  });
});
