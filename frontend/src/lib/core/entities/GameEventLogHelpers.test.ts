import { describe, expect, it } from "vitest";

import {
  create_empty_game_event_log_input,
  GAME_EVENT_TYPE_OPTIONS,
  is_card_event,
  is_scoring_event,
  TEAM_SIDE_OPTIONS,
  validate_game_event_log_input,
} from "./GameEventLogHelpers";

describe("GameEventLogHelpers", () => {
  it("creates empty inputs with the provided parent identifiers", () => {
    expect(
      create_empty_game_event_log_input("org_1", "live_1", "fixture_1"),
    ).toMatchObject({
      organization_id: "org_1",
      live_game_log_id: "live_1",
      fixture_id: "fixture_1",
      event_type: "goal",
      team_side: "home",
    });
  });

  it("validates required fields, minute bounds, and team sides", () => {
    expect(
      validate_game_event_log_input({
        organization_id: "",
        live_game_log_id: "",
        fixture_id: "",
        event_type: "",
        minute: -1,
        team_side: "neutral",
      } as never),
    ).toEqual({
      is_valid: false,
      errors: {
        organization_id: "Organization is required",
        live_game_log_id: "Live game log is required",
        fixture_id: "Fixture is required",
        event_type: "Event type is required",
        minute: "Minute cannot be negative",
        team_side: "Invalid team side",
      },
    });
  });

  it("classifies scoring and card events and exposes option lists", () => {
    expect(is_scoring_event("goal")).toBe(true);
    expect(is_scoring_event("foul")).toBe(false);
    expect(is_card_event("yellow_card")).toBe(true);
    expect(is_card_event("goal")).toBe(false);
    expect(GAME_EVENT_TYPE_OPTIONS[0]).toEqual({
      value: "goal",
      label: "Goal",
    });
    expect(TEAM_SIDE_OPTIONS).toContainEqual({
      value: "match",
      label: "Match",
    });
  });
});
