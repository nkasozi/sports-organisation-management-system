import { describe, expect, it } from "vitest";

import {
  build_event_correction_record,
  decide_event_correction,
  describe_event_edit_allowance,
  EDIT_ALLOWANCE,
  read_event_edits_used,
  summarize_game_event,
} from "./FixtureEventCorrections";

const OFFICIAL = {
  name: "Grace Akello",
  role_label: "Table Official",
  allowance: { status: EDIT_ALLOWANCE.LIMITED, max_edits: 3 },
} as const;
const MANAGER = {
  name: "Moses Officials",
  role_label: "Officials Manager",
  allowance: { status: EDIT_ALLOWANCE.UNLIMITED },
} as const;

function fixture(status: string, event_edits_used?: number): never {
  return { status, event_edits_used } as never;
}

describe("event corrections", () => {
  it("needs a reason so viewers understand what changed", () => {
    expect(
      decide_event_correction(fixture("in_progress"), {
        reason: "  ",
        author: OFFICIAL,
      }),
    ).toEqual({
      allowed: false,
      reason:
        "Give a reason for this correction. It is shown in the match log.",
    });
  });

  it("lets an official correct while they have edits left", () => {
    expect(
      decide_event_correction(fixture("in_progress", 2), {
        reason: "Wrong scorer",
        author: OFFICIAL,
      }),
    ).toEqual({ allowed: true });
  });

  it("stops an official who has used all the game's edits and says how to fix it", () => {
    const decision = decide_event_correction(fixture("in_progress", 3), {
      reason: "Wrong scorer",
      author: OFFICIAL,
    });

    expect(decision).toEqual({
      allowed: false,
      reason:
        "You've used all 3 event edits for this game. Ask your officials manager to reset this game's edits.",
    });
  });

  it("explains when the competition doesn't allow officials to edit events", () => {
    const decision = decide_event_correction(fixture("in_progress"), {
      reason: "Wrong scorer",
      author: {
        ...OFFICIAL,
        allowance: { status: EDIT_ALLOWANCE.LIMITED, max_edits: 0 },
      },
    });

    expect(decision).toMatchObject({ allowed: false });
    if (decision.allowed) return;
    expect(decision.reason).toContain("turned off for this competition");
  });

  it("stops officials changing a finished game but lets managers correct it", () => {
    const request = { reason: "Scorer mix-up", author: OFFICIAL };
    expect(
      decide_event_correction(fixture("completed"), request),
    ).toMatchObject({
      allowed: false,
    });
    expect(
      decide_event_correction(fixture("completed", 9), {
        reason: "Scorer mix-up",
        author: MANAGER,
      }),
    ).toEqual({ allowed: true });
  });

  it("describes how many edits are left", () => {
    expect(
      describe_event_edit_allowance(
        fixture("in_progress", 1),
        OFFICIAL.allowance,
      ),
    ).toBe("2 of 3 event edits left for this game");
    expect(
      describe_event_edit_allowance(
        fixture("in_progress", 3),
        OFFICIAL.allowance,
      ),
    ).toBe("No event edits left for this game");
    expect(
      describe_event_edit_allowance(fixture("in_progress"), MANAGER.allowance),
    ).toBe("");
    expect(read_event_edits_used(fixture("in_progress"))).toBe(0);
  });

  it("records who corrected which event, from what to what, and why", () => {
    const record = build_event_correction_record({
      id: "c1",
      kind: "edited",
      event_id: "e1",
      before: "Goal 14' Robert Kizza",
      after: "Goal 16' Robert Kizza",
      reason: "Wrong minute",
      author: OFFICIAL,
      corrected_at: "2026-10-28T10:00:00.000Z",
    });

    expect(record).toEqual({
      id: "c1",
      kind: "edited",
      event_id: "e1",
      event_before: "Goal 14' Robert Kizza",
      event_after: "Goal 16' Robert Kizza",
      reason: "Wrong minute",
      corrected_by: "Grace Akello",
      corrected_by_role: "Table Official",
      corrected_at: "2026-10-28T10:00:00.000Z",
    });
  });

  it("summarises an event for the match log", () => {
    expect(
      summarize_game_event({
        event_type: "goal",
        minute: 14,
        player_name: "Robert Kizza",
        secondary_player_name: "",
      } as never),
    ).toBe("Goal 14' Robert Kizza");
  });
});
