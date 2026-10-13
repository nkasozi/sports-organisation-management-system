import { afterEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_team_membership_use_cases } from "./PlayerTeamMembershipUseCases";
import { create_mock_repository } from "./PlayerTeamMembershipUseCases.test_support";

describe("PlayerTeamMembershipUseCases failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = create_mock_repository();
    vi.mocked(repository.delete_by_ids).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const use_cases = create_player_team_membership_use_cases(repository);

    const result = await use_cases.delete_memberships(["m-1", "m-2"]);

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerTeamMembershipUseCases]", {
      event: "player_team_membership_bulk_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      membership_ids: ["m-1", "m-2"],
    });
  });

  it("keeps the specific message for a missing membership id", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const use_cases = create_player_team_membership_use_cases(
      create_mock_repository(),
    );

    const result = await use_cases.get_by_id("");

    expect(result).toEqual({
      success: false,
      error: "Membership ID is required",
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerTeamMembershipUseCases]", {
      event: "player_team_membership_get_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });

  it("keeps the specific message for empty bulk ids", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const use_cases = create_player_team_membership_use_cases(
      create_mock_repository(),
    );

    const result = await use_cases.delete_memberships([]);

    expect(result).toEqual({
      success: false,
      error: "At least one membership ID is required",
    });
  });
});
