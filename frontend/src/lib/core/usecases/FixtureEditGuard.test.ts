import { describe, expect, it } from "vitest";

import { decide_fixture_edit, FIXTURE_EDIT_DECISION } from "./FixtureEditGuard";
import { create_test_fixture } from "./FixtureUseCases.test_support";

describe("decide_fixture_edit", () => {
  it("allows changing schedule details", () => {
    const decision = decide_fixture_edit(create_test_fixture(), {
      venue: "New Ground",
      scheduled_time: "18:00",
    });
    expect(decision).toEqual({
      kind: FIXTURE_EDIT_DECISION.ALLOWED,
      updates: { venue: "New Ground", scheduled_time: "18:00" },
    });
  });

  it("drops live-game fields that a form submits unchanged", () => {
    const fixture = create_test_fixture({
      status: "in_progress",
      home_team_score: 2,
      away_team_score: 1,
    });
    const decision = decide_fixture_edit(fixture, {
      notes: "Rain delay",
      status: "in_progress",
      home_team_score: 2,
      away_team_score: 1,
      current_period: fixture.current_period,
      current_minute: fixture.current_minute,
      game_events: fixture.game_events,
    });
    expect(decision).toEqual({
      kind: FIXTURE_EDIT_DECISION.ALLOWED,
      updates: { notes: "Rain delay" },
    });
  });

  it.each([
    ["home_team_score", 3],
    ["away_team_score", 4],
    ["current_period", "second_half"],
    ["current_minute", 70],
    ["clock_status", "running"],
    ["clock_elapsed_seconds", 120],
    ["clock_started_at", "2024-06-15T15:00:00.000Z"],
    ["game_events", [{ id: "e1" }]],
  ])("rejects changing the live-game field %s", (field_name, value) => {
    const decision = decide_fixture_edit(create_test_fixture(), {
      [field_name]: value,
    });
    expect(decision.kind).toBe(FIXTURE_EDIT_DECISION.REJECTED);
  });

  it.each([
    ["scheduled", "postponed"],
    ["scheduled", "cancelled"],
    ["postponed", "scheduled"],
    ["postponed", "cancelled"],
  ])("allows the administrative correction %s to %s", (from, to) => {
    const decision = decide_fixture_edit(
      create_test_fixture({ status: from as never }),
      { status: to as never },
    );
    expect(decision).toEqual({
      kind: FIXTURE_EDIT_DECISION.ALLOWED,
      updates: { status: to },
    });
  });

  it.each([
    ["scheduled", "in_progress"],
    ["scheduled", "completed"],
    ["in_progress", "completed"],
    ["in_progress", "scheduled"],
    ["completed", "scheduled"],
    ["cancelled", "scheduled"],
    ["scheduled", "paused"],
  ])(
    "rejects changing the status from %s to %s outside the live game",
    (from, to) => {
      const decision = decide_fixture_edit(
        create_test_fixture({ status: from as never }),
        { status: to as never },
      );
      expect(decision.kind).toBe(FIXTURE_EDIT_DECISION.REJECTED);
    },
  );
});
