import { describe, expect, it } from "vitest";

import type { FixtureLineup } from "../entities/FixtureLineup";
import { LINEUP_STATUS } from "../entities/StatusConstants";
import { LINEUP_ACTION } from "./FixtureLineupConstants";
import {
  decide_lineup_edit,
  decide_lineup_transition,
  LINEUP_DECISION,
} from "./FixtureLineupStateMachine";

const NOW = "2026-01-01T00:00:00.000Z" as FixtureLineup["submitted_at"];

function lineup(
  status: FixtureLineup["status"],
  player_count = 1,
): FixtureLineup {
  return {
    id: "l1",
    status,
    selected_players: Array.from({ length: player_count }, () => ({})),
  } as unknown as FixtureLineup;
}

describe("FixtureLineupStateMachine", () => {
  it("allows submitting a draft lineup with players", () => {
    expect(
      decide_lineup_transition(
        lineup(LINEUP_STATUS.DRAFT),
        LINEUP_ACTION.SUBMIT,
        NOW,
      ),
    ).toEqual({
      kind: LINEUP_DECISION.ALLOWED,
      value: { status: LINEUP_STATUS.SUBMITTED, submitted_at: NOW },
    });
  });

  it.each([
    [LINEUP_STATUS.LOCKED, 1, "Cannot submit a locked lineup"],
    [LINEUP_STATUS.SUBMITTED, 1, "Lineup is already submitted"],
    [LINEUP_STATUS.DRAFT, 0, "Cannot submit an empty lineup"],
  ] as const)("rejects submitting a %s lineup", (status, players, reason) => {
    expect(
      decide_lineup_transition(
        lineup(status, players),
        LINEUP_ACTION.SUBMIT,
        NOW,
      ),
    ).toEqual({ kind: LINEUP_DECISION.REJECTED, reason });
  });

  it.each([LINEUP_STATUS.DRAFT, LINEUP_STATUS.SUBMITTED])(
    "allows locking a %s lineup with players",
    (status) => {
      expect(
        decide_lineup_transition(lineup(status), LINEUP_ACTION.LOCK, NOW),
      ).toEqual({
        kind: LINEUP_DECISION.ALLOWED,
        value: { status: LINEUP_STATUS.LOCKED },
      });
    },
  );

  it.each([
    [LINEUP_STATUS.LOCKED, 1, "Lineup is already locked"],
    [LINEUP_STATUS.SUBMITTED, 0, "Cannot lock an empty lineup"],
  ] as const)("rejects locking a %s lineup", (status, players, reason) => {
    expect(
      decide_lineup_transition(
        lineup(status, players),
        LINEUP_ACTION.LOCK,
        NOW,
      ),
    ).toEqual({ kind: LINEUP_DECISION.REJECTED, reason });
  });

  it("only blocks edits of locked lineups", () => {
    expect(
      decide_lineup_edit(lineup(LINEUP_STATUS.LOCKED), LINEUP_ACTION.DELETE),
    ).toEqual({
      kind: LINEUP_DECISION.REJECTED,
      reason: "Cannot delete a locked lineup",
    });
    expect(
      decide_lineup_edit(lineup(LINEUP_STATUS.SUBMITTED), LINEUP_ACTION.UPDATE)
        .kind,
    ).toBe(LINEUP_DECISION.ALLOWED);
  });
});
