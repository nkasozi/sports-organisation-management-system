import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import {
  get_live_game_check_class,
  get_live_game_check_container_class,
  get_live_game_check_icon,
  get_live_game_matchup_label,
  get_live_game_status_badge_class,
} from "./liveGamesViewLogic";

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    scheduled_date: "2026-04-07",
    scheduled_time: "14:00",
    status: "scheduled",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}

describe("liveGamesViewLogic", () => {
  it("returns the purple badge classes for postponed fixtures", () => {
    const result = get_live_game_status_badge_class("postponed");

    expect(result).toContain("bg-purple-100");
    expect(result).toContain("text-purple-700");
  });

  it("returns the failed check icon and classes", () => {
    expect(get_live_game_check_icon("failed")).toBe("✗");
    expect(get_live_game_check_class("failed")).toContain("text-red-600");
    expect(get_live_game_check_container_class("failed")).toContain(
      "bg-red-50",
    );
  });

  it("builds the matchup label from loaded team names first", () => {
    const fixture = create_fixture();
    const team_names = {
      team_1: "Weatherhead Hockey Club",
      team_2: "Kampala Hockey Club",
    };

    const result = get_live_game_matchup_label(fixture, team_names);

    expect(result).toBe("Weatherhead Hockey Club vs Kampala Hockey Club");
  });

  it("falls back to fixture team names when the map is missing entries", () => {
    const fixture = create_fixture({
      home_team_name: "Home Name",
      away_team_name: "Away Name",
    });

    const result = get_live_game_matchup_label(fixture, {});

    expect(result).toBe("Home Name vs Away Name");
  });
});
