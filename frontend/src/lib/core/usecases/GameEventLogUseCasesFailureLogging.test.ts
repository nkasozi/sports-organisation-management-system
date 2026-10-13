import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEventLogRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_game_event_log_use_cases,
  type GameEventLogUseCases,
} from "./GameEventLogUseCases";
import {
  create_mock_game_event_log,
  create_mock_repository,
} from "./GameEventLogUseCases.test_support";

describe("GameEventLogUseCases failure logging", () => {
  let use_cases: GameEventLogUseCases;
  let mock_repository: GameEventLogRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_log_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error on delete", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_mock_game_event_log(),
    });
    vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const result = await use_cases.delete("event-001");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[GameEventLogUseCases]", {
      event: "game_event_log_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      game_event_log_id: "event-001",
    });
  });

  it("keeps the specific message when the void target is missing", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'event-404' not found",
    });
    const result = await use_cases.void_event("event-404", "typo", "user-001");
    expect(result).toEqual({
      success: false,
      error: "Game event log not found",
    });
    expect(console.error).toHaveBeenCalledWith("[GameEventLogUseCases]", {
      event: "game_event_log_void_target_not_found",
      error_code: UseCaseErrorCode.NOT_FOUND,
      technical_detail: "Entity with id 'event-404' not found",
      game_event_log_id: "event-404",
    });
  });

  it("logs the voided state transition when updating a voided event", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_mock_game_event_log({ voided: true }),
    });
    const result = await use_cases.update("event-001", { minute: 30 });
    expect(result).toEqual({
      success: false,
      error: "Cannot update a voided event",
    });
    expect(console.error).toHaveBeenCalledWith("[GameEventLogUseCases]", {
      event: "game_event_log_update_target_voided",
      error_code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
      game_event_log_id: "event-001",
    });
  });

  it("returns a user-safe message when recording a goal fails", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: false,
      error: "Quota exceeded",
    });
    const result = await use_cases.record_goal(
      "livegame-001",
      "fixture-001",
      "org-001",
      12,
      "away",
      "player-001",
      "John Doe",
      "user-001",
    );
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(mock_repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ score_change_home: 0, score_change_away: 1 }),
    );
    expect(console.error).toHaveBeenCalledWith("[GameEventLogUseCases]", {
      event: "game_event_log_record_goal_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Quota exceeded",
      fixture_id: "fixture-001",
      live_game_log_id: "livegame-001",
    });
  });

  it("keeps the missing identifier message for blank fixture ids", async () => {
    const result = await use_cases.get_events_for_fixture("");
    expect(result).toEqual({ success: false, error: "Fixture ID is required" });
  });
});
