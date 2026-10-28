import { describe, expect, it } from "vitest";

import { EDIT_ALLOWANCE } from "../entities/FixtureEventCorrections";
import {
  build_edit_allowance_reset_plan,
  build_event_edit_plan,
  build_event_removal_plan,
} from "./FixtureGameEventCorrectionPlans";
import { FIXTURE_PLAN_DECISION } from "./FixturePeriodTransition";

const GOAL = {
  id: "e1",
  event_type: "goal",
  minute: 14,
  stoppage_time_minute: 0,
  team_side: "away",
  player_name: "Robert Kizza",
  secondary_player_name: "",
  description: "",
  recorded_at: "2026-10-28T10:00:00Z",
  points_awarded: 1,
};
const OFFICIAL = {
  name: "Grace Akello",
  role_label: "Table Official",
  allowance: { status: EDIT_ALLOWANCE.LIMITED, max_edits: 3 },
} as const;
const MANAGER = {
  name: "Moses Okello",
  role_label: "Officials Manager",
  allowance: { status: EDIT_ALLOWANCE.UNLIMITED },
} as const;

function fixture(overrides: Record<string, unknown> = {}): never {
  return {
    id: "f1",
    status: "in_progress",
    game_events: [GOAL],
    home_team_score: 0,
    away_team_score: 1,
    event_edits_used: 1,
    event_corrections: [],
    ...overrides,
  } as never;
}

describe("correction plans", () => {
  it("edits the event, uses one of the official's edits and logs the change", () => {
    const decision = build_event_edit_plan("e1", { minute: 16 } as never, {
      reason: "Wrong minute",
      author: OFFICIAL,
    })(fixture());

    expect(decision.kind).toBe(FIXTURE_PLAN_DECISION.APPLY);
    if (decision.kind !== FIXTURE_PLAN_DECISION.APPLY) return;
    expect(decision.plan.updates.game_events?.[0].minute).toBe(16);
    expect(decision.plan.updates.event_edits_used).toBe(2);
    expect(decision.plan.updates.event_corrections).toEqual([
      expect.objectContaining({
        kind: "edited",
        event_id: "e1",
        event_before: "Goal 14' Robert Kizza",
        event_after: "Goal 16' Robert Kizza",
        reason: "Wrong minute",
        corrected_by: "Grace Akello",
        corrected_by_role: "Table Official",
      }),
    ]);
  });

  it("removes the event, takes it off the score and logs it", () => {
    const decision = build_event_removal_plan("e1", {
      reason: "Goal disallowed",
      author: MANAGER,
    })(fixture());

    expect(decision.kind).toBe(FIXTURE_PLAN_DECISION.APPLY);
    if (decision.kind !== FIXTURE_PLAN_DECISION.APPLY) return;
    expect(decision.plan.updates).toMatchObject({
      game_events: [],
      away_team_score: 0,
      event_edits_used: 1,
    });
    expect(decision.plan.updates.event_corrections?.[0]).toMatchObject({
      kind: "removed",
      event_before: "Goal 14' Robert Kizza",
      event_after: "",
    });
  });

  it("refuses when the official has no edits left", () => {
    const decision = build_event_edit_plan("e1", { minute: 16 } as never, {
      reason: "Wrong minute",
      author: OFFICIAL,
    })(fixture({ event_edits_used: 3 }));

    expect(decision).toEqual({
      kind: FIXTURE_PLAN_DECISION.REJECT,
      reason:
        "You've used all 3 event edits for this game. Ask your officials manager to reset this game's edits.",
    });
  });

  it("gives a game a fresh set of edits and records who did it", () => {
    const decision = build_edit_allowance_reset_plan(MANAGER)(
      fixture({ event_edits_used: 3 }),
    );

    expect(decision.kind).toBe(FIXTURE_PLAN_DECISION.APPLY);
    if (decision.kind !== FIXTURE_PLAN_DECISION.APPLY) return;
    expect(decision.plan.updates.event_edits_used).toBe(0);
    expect(decision.plan.updates.event_corrections?.[0]).toMatchObject({
      kind: "edits_reset",
      event_before: "3 edits used",
      event_after: "0 edits used",
      corrected_by: "Moses Okello",
      corrected_by_role: "Officials Manager",
    });
  });
});
