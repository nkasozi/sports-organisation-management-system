import { describe, expect, it } from "vitest";

import { GAME_STATUS, type GameStatusValue } from "../entities/StatusConstants";
import { create_mock_live_game_log } from "./LiveGameLogUseCases.test_support";
import {
  build_live_game_transition_updates,
  decide_live_game_transition,
  LiveGameCommand,
  type LiveGameCommandValue,
  LiveGameTransitionOutcome,
} from "./LiveGameStateMachine";

const ALLOWED_TRANSITIONS: Record<
  LiveGameCommandValue,
  Partial<Record<GameStatusValue, GameStatusValue>>
> = {
  [LiveGameCommand.START]: {
    pre_game: GAME_STATUS.IN_PROGRESS,
    paused: GAME_STATUS.IN_PROGRESS,
  },
  [LiveGameCommand.PAUSE]: { in_progress: GAME_STATUS.PAUSED },
  [LiveGameCommand.RESUME]: { paused: GAME_STATUS.IN_PROGRESS },
  [LiveGameCommand.END]: {
    in_progress: GAME_STATUS.COMPLETED,
    paused: GAME_STATUS.COMPLETED,
  },
  [LiveGameCommand.ABANDON]: {
    pre_game: GAME_STATUS.ABANDONED,
    in_progress: GAME_STATUS.ABANDONED,
    paused: GAME_STATUS.ABANDONED,
  },
};

const ALL_CASES = Object.values(LiveGameCommand).flatMap((command) =>
  Object.values(GAME_STATUS).map(
    (status) => [command, status] as [LiveGameCommandValue, GameStatusValue],
  ),
);

describe("decide_live_game_transition", () => {
  it.each(ALL_CASES)(
    "%s from %s follows the transition table",
    (command, status) => {
      const expected_next = ALLOWED_TRANSITIONS[command][status];
      const decision = decide_live_game_transition(status, command);

      expect(decision.outcome).toBe(
        expected_next === undefined
          ? LiveGameTransitionOutcome.REJECTED
          : LiveGameTransitionOutcome.ALLOWED,
      );
      expect(decision).toEqual(
        expected_next === undefined
          ? {
              outcome: LiveGameTransitionOutcome.REJECTED,
              reason: expect.any(String),
            }
          : {
              outcome: LiveGameTransitionOutcome.ALLOWED,
              next_status: expected_next,
            },
      );
    },
  );

  it("keeps the in-progress period when resuming via start", () => {
    const updates = build_live_game_transition_updates(
      create_mock_live_game_log({ current_period: "second_half" }),
      { command: LiveGameCommand.START, user_id: "u1" },
      GAME_STATUS.IN_PROGRESS,
    );

    expect(updates.current_period).toBe("second_half");
  });
});
