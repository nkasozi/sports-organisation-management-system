import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveGameLogRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_live_game_log_use_cases } from "./LiveGameLogUseCases";
import {
  create_mock_live_game_log,
  create_mock_repository,
} from "./LiveGameLogUseCases.test_support";

describe("LiveGameLogUseCases failure logging", () => {
  let repository: LiveGameLogRepository;

  beforeEach(() => {
    repository = create_mock_repository();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a conflict when a live game already exists for the fixture", async () => {
    vi.mocked(repository.get_live_game_log_for_fixture).mockResolvedValue({
      success: true,
      data: create_mock_live_game_log({ id: "existing-1" }),
    });

    const result = await create_live_game_log_use_cases(repository).create({
      ...create_mock_live_game_log(),
      fixture_id: "fixture-001",
      organization_id: "org-001",
    });

    expect(result).toEqual({
      success: false,
      error: "A live game log already exists for this fixture",
    });
    expect(console.error).toHaveBeenCalledWith("[LiveGameLogUseCases]", {
      event: "live_game_create_duplicate_for_fixture",
      error_code: UseCaseErrorCode.CONFLICT,
      fixture_id: "fixture-001",
      live_game_id: "existing-1",
    });
  });

  it("hides repository errors from the user when listing fails", async () => {
    vi.mocked(repository.find_completed_games).mockResolvedValue({
      success: false,
      error: "IndexedDB read failed",
    });

    const result =
      await create_live_game_log_use_cases(repository).list_completed_games(
        "org-001",
      );

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[LiveGameLogUseCases]", {
      event: "live_game_list_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB read failed",
      organization_id: "org-001",
    });
  });
});
