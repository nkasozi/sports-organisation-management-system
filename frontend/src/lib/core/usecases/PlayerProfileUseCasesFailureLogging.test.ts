import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerProfileRepository } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_profile_use_cases } from "./PlayerProfileUseCases";
import {
  create_mock_player_profile,
  create_mock_repository,
  create_valid_player_profile_input,
} from "./PlayerProfileUseCases.test_support";

describe("PlayerProfileUseCases failure logging", () => {
  let mock_repository: PlayerProfileRepository;
  let use_cases: ReturnType<typeof create_player_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_profile_use_cases(mock_repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
      create_failure_result("IndexedDB transaction aborted"),
    );
    const result = await use_cases.delete("p_123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerProfileUseCases]", {
      event: "player_profile_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      player_profile_id: "p_123",
    });
  });

  it("logs a duplicate profile as a conflict with the existing message", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
      create_success_result(create_mock_player_profile({ id: "p_existing" })),
    );
    const result = await use_cases.create(create_valid_player_profile_input());
    expect(result).toEqual({
      success: false,
      error: "A profile already exists for this player",
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerProfileUseCases]", {
      event: "player_profile_create_already_exists",
      error_code: UseCaseErrorCode.CONFLICT,
      player_id: "player_1",
      player_profile_id: "p_existing",
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });

  it("logs a missing slug with the existing message", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await use_cases.get_by_slug(" ");
    expect(result).toEqual({
      success: false,
      error: "Profile slug is required",
    });
    expect(error_spy).toHaveBeenCalledWith("[PlayerProfileUseCases]", {
      event: "player_profile_get_by_slug_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
