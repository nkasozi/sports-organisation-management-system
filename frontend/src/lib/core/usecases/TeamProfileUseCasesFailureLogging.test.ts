import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamProfileRepository } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_profile_use_cases } from "./TeamProfileUseCases";
import { create_mock_repository } from "./TeamProfileUseCases.test_support";

describe("TeamProfileUseCases failure logging", () => {
  let mock_repository: TeamProfileRepository;
  let use_cases: ReturnType<typeof create_team_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_profile_use_cases(mock_repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.update).mockResolvedValue(
      create_failure_result("IndexedDB transaction aborted"),
    );
    const result = await use_cases.update("tp_123", {
      profile_summary: "Updated",
    });
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[TeamProfileUseCases]", {
      event: "team_profile_update_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      team_profile_id: "tp_123",
    });
  });

  it("logs a missing team id with the existing message", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await use_cases.get_by_team_id("");
    expect(result).toEqual({ success: false, error: "Team ID is required" });
    expect(error_spy).toHaveBeenCalledWith("[TeamProfileUseCases]", {
      event: "team_profile_get_by_team_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
