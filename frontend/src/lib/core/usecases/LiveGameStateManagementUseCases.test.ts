import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveGameLog } from "../entities/LiveGameLog";
import type { LiveGameLogRepository } from "../interfaces/ports";
import { create_success_result, type Result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
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

type TransitionMethod =
  | "start_game"
  | "pause_game"
  | "resume_game"
  | "end_game"
  | "abandon_game";

function game(
  game_status: LiveGameLog["game_status"],
  current_period: LiveGameLog["current_period"] = "pre_game",
): LiveGameLog {
  return create_mock_live_game_log({
    id: "g1",
    fixture_id: "f1",
    game_status,
    current_period,
  });
}

function setup(
  status: LiveGameLog["game_status"],
  current_period?: LiveGameLog["current_period"],
): {
  repository: LiveGameLogRepository;
  state: ReturnType<typeof create_live_game_state_management>;
} {
  const repository = create_echoing_repository(
    create_success_result(game(status, current_period)),
  );
  return { repository, state: create_live_game_state_management(repository) };
}

function run_transition(
  state: ReturnType<typeof create_live_game_state_management>,
  method: TransitionMethod,
): Promise<Result<LiveGameLog>> {
  switch (method) {
    case "start_game":
      return state.start_game("g1", "u1");
    case "pause_game":
      return state.pause_game("g1");
    case "resume_game":
      return state.resume_game("g1");
    case "end_game":
      return state.end_game("g1", "u1");
    case "abandon_game":
      return state.abandon_game("g1", "u1", "why");
  }
}

describe("create_live_game_state_management transitions", () => {
  beforeEach(() => {
    mocks.emit_entity_updated.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts pre-game and paused games", async () => {
    const pre_game = setup("pre_game");
    const paused = setup("paused", "second_half");

    expect((await pre_game.state.start_game("g1", "u1")).success).toBe(true);
    expect((await paused.state.start_game("g1", "u1")).success).toBe(true);

    expect(pre_game.repository.update).toHaveBeenCalledWith("g1", {
      game_status: "in_progress",
      clock_running: true,
      started_by_user_id: "u1",
      current_period: "first_half",
    });
    expect(paused.repository.update).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ current_period: "second_half" }),
    );
    expect(mocks.emit_entity_updated).toHaveBeenCalledWith(
      "livegamelog",
      "g1",
      "Game f1 - in_progress",
      expect.objectContaining({ id: "g1", game_status: "pre_game" }),
      expect.objectContaining({ game_status: "in_progress" }),
      ["game_status", "clock_running", "started_by_user_id", "current_period"],
    );
  });

  it.each<[TransitionMethod, LiveGameLog["game_status"], string]>([
    ["start_game", "completed", "Cannot start a game that is completed"],
    ["pause_game", "paused", "Can only pause an in-progress game"],
    ["resume_game", "in_progress", "Can only resume a paused game"],
    ["end_game", "pre_game", "Cannot end a game that is pre_game"],
    [
      "abandon_game",
      "abandoned",
      "Cannot abandon a game that is already abandoned",
    ],
    [
      "abandon_game",
      "completed",
      "Cannot abandon a game that is already completed",
    ],
  ])("%s rejects %s games", async (method, status, error) => {
    const { repository, state } = setup(status);

    expect(await run_transition(state, method)).toEqual({
      success: false,
      error,
    });
    expect(repository.update).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "[LiveGameLogUseCases]",
      expect.objectContaining({
        event: "live_game_transition_rejected",
        error_code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
        live_game_id: "g1",
        game_status: status,
      }),
    );
  });

  it.each<[TransitionMethod, LiveGameLog["game_status"], object]>([
    [
      "pause_game",
      "in_progress",
      { game_status: "paused", clock_running: false },
    ],
    [
      "resume_game",
      "paused",
      { game_status: "in_progress", clock_running: true },
    ],
    [
      "end_game",
      "paused",
      {
        game_status: "completed",
        clock_running: false,
        current_period: "finished",
        ended_by_user_id: "u1",
      },
    ],
    [
      "abandon_game",
      "in_progress",
      {
        game_status: "abandoned",
        clock_running: false,
        ended_by_user_id: "u1",
        notes: "why",
      },
    ],
  ])("%s applies the transition from %s", async (method, status, updates) => {
    const { repository, state } = setup(status);

    expect((await run_transition(state, method)).success).toBe(true);

    expect(repository.update).toHaveBeenCalledWith("g1", updates);
    expect(mocks.emit_entity_updated.mock.calls[0][5]).toEqual(
      Object.keys(updates),
    );
  });

  it("reports unknown games for transitions", async () => {
    const state = create_live_game_state_management(
      create_echoing_repository(MISSING_LIVE_GAME_RESULT),
    );

    expect(await state.pause_game("g1")).toEqual({
      success: false,
      error: "Live game log not found",
    });
  });
});
