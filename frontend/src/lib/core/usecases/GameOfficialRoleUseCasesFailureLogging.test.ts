import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameOfficialRoleRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_game_official_role_use_cases,
  type GameOfficialRoleUseCases,
} from "./GameOfficialRoleUseCases";
import { create_mock_repository } from "./GameOfficialRoleUseCases.test_support";

describe("GameOfficialRoleUseCases failure logging", () => {
  let mock_repository: GameOfficialRoleRepository;
  let use_cases: GameOfficialRoleUseCases;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_official_role_use_cases(mock_repository);
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
    const result = await use_cases.delete("role-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[GameOfficialRoleUseCases]", {
      event: "game_official_role_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      game_official_role_id: "role-123",
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
      error: "Official role not found",
    });
    expect(console.error).toHaveBeenCalledWith("[GameOfficialRoleUseCases]", {
      event: "game_official_role_update_target_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'missing-404' not found",
      game_official_role_id: "missing-404",
    });
  });

  it("logs a missing identifier with a stable event", async () => {
    const result = await use_cases.get_by_id("");
    expect(result.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith("[GameOfficialRoleUseCases]", {
      event: "game_official_role_get_id_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
