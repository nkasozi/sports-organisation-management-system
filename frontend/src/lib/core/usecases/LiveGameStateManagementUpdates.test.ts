import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveGameLog } from "../entities/LiveGameLog";
import type { LiveGameLogRepository } from "../interfaces/ports";
import { create_success_result, type Result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_echoing_repository,
  create_mock_live_game_log,
  MISSING_LIVE_GAME_RESULT,
} from "./LiveGameLogUseCases.test_support";
import { create_live_game_state_management } from "./LiveGameStateManagementUseCases";

const mocks = vi.hoisted(() => ({ emit_entity_updated: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: mocks.emit_entity_updated },
}));

const UNKNOWN_STATUS_GAME = create_mock_live_game_log({
  id: "g1",
  fixture_id: "",
  game_status: "" as LiveGameLog["game_status"],
  current_period: "first_half",
});

function create_repository(
  existing: Result<LiveGameLog> = create_success_result(UNKNOWN_STATUS_GAME),
): LiveGameLogRepository {
  return create_echoing_repository(existing);
}

function state_for(
  repository: LiveGameLogRepository,
): ReturnType<typeof create_live_game_state_management> {
  return create_live_game_state_management(repository);
}

function expect_all_succeeded(results: Array<Result<LiveGameLog>>): void {
  expect(results.map((result) => result.success)).toEqual(
    results.map(() => true),
  );
}

describe("create_live_game_state_management updates", () => {
  beforeEach(() => {
    mocks.emit_entity_updated.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates scores and emits with an unknown-status display name", async () => {
    const repository = create_repository();

    expect_all_succeeded([
      await state_for(repository).update_score("g1", 2, 1),
    ]);

    expect(repository.update).toHaveBeenCalledWith("g1", {
      home_team_score: 2,
      away_team_score: 1,
    });
    expect(mocks.emit_entity_updated.mock.calls[0][2]).toBe(
      "Game g1 - unknown",
    );
    expect(mocks.emit_entity_updated.mock.calls[0][5]).toEqual([
      "home_team_score",
      "away_team_score",
    ]);
  });

  it("rejects negative scores and minutes", async () => {
    const state = state_for(create_repository());

    expect(await state.update_score("g1", -1, 0)).toEqual({
      success: false,
      error: "Scores cannot be negative",
    });
    expect(await state.update_game_clock("g1", -1)).toEqual({
      success: false,
      error: "Current minute cannot be negative",
    });
    expect(console.error).toHaveBeenCalledWith("[LiveGameLogUseCases]", {
      event: "live_game_state_update_rejected",
      error_code: UseCaseErrorCode.VALIDATION_FAILED,
      live_game_id: "g1",
    });
  });

  it("updates the clock with optional stoppage time", async () => {
    const repository = create_repository();
    const state = state_for(repository);

    expect_all_succeeded([
      await state.update_game_clock("g1", 30),
      await state.update_game_clock("g1", 45, 3),
    ]);

    expect(vi.mocked(repository.update).mock.calls).toEqual([
      ["g1", { current_minute: 30 }],
      ["g1", { current_minute: 45, stoppage_time_minutes: 3 }],
    ]);
    expect(mocks.emit_entity_updated.mock.calls.map((call) => call[5])).toEqual(
      [["current_minute"], ["current_minute", "stoppage_time_minutes"]],
    );
  });

  it("advances periods", async () => {
    const repository = create_repository();

    expect_all_succeeded([
      await state_for(repository).advance_period("g1", "second_half"),
    ]);

    expect(repository.update).toHaveBeenCalledWith("g1", {
      current_period: "second_half",
    });
    expect(mocks.emit_entity_updated.mock.calls[0][5]).toEqual([
      "current_period",
    ]);
  });

  it("still updates but does not emit when the previous game is unknown", async () => {
    const repository = create_repository(MISSING_LIVE_GAME_RESULT);
    const state = state_for(repository);

    expect_all_succeeded([
      await state.update_score("g1", 1, 1),
      await state.update_game_clock("g1", 10, 1),
      await state.advance_period("g1", "half_time"),
    ]);

    expect(repository.update).toHaveBeenCalledTimes(3);
    expect(mocks.emit_entity_updated).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("[LiveGameLogUseCases]", {
      event: "live_game_previous_snapshot_unavailable",
      live_game_id: "g1",
      technical_detail: "missing",
    });
  });

  it("does not emit and returns a user-safe message when the update fails", async () => {
    const repository = create_repository();
    vi.mocked(repository.update).mockResolvedValue({
      success: false,
      error: "nope",
    });

    expect(
      await state_for(repository).advance_period("g1", "half_time"),
    ).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(mocks.emit_entity_updated).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[LiveGameLogUseCases]", {
      event: "live_game_state_update_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "nope",
      live_game_id: "g1",
    });
  });
});
