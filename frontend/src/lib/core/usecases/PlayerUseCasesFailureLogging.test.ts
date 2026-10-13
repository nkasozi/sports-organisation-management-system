import { afterEach, describe, expect, it, vi } from "vitest";

import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_use_cases } from "./PlayerUseCases";
import { create_mock_repository } from "./PlayerUseCases.test_support";

describe("PlayerUseCases failure logging", () => {
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
    const use_cases = create_player_use_cases(repository);

    const result = await use_cases.delete("player-123");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerUseCases]", {
      event: "player_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      player_id: "player-123",
    });
  });

  it("logs a missing identifier and keeps the specific message", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const use_cases = create_player_use_cases(create_mock_repository());

    const result = await use_cases.list_players_by_team("  ");

    expect(result).toEqual({ success: false, error: "Team ID is required" });
    expect(error_spy).toHaveBeenCalledWith("[PlayerUseCases]", {
      event: "player_list_by_team_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
