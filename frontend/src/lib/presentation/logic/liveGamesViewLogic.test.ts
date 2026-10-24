import { afterEach, describe, expect, it, vi } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  format_live_game_kickoff,
  get_live_game_check_class,
  get_live_game_check_container_class,
  get_live_game_check_icon,
  get_live_game_matchup_label,
  get_live_game_status_badge_class,
} from "./liveGamesViewLogic";

function create_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
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
  } as unknown as Fixture;
}

describe("format_live_game_kickoff", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the kickoff like the dashboard does instead of the browser locale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T08:00:00.000Z"));

    const result = format_live_game_kickoff(
      create_fixture({ scheduled_date: "2026-10-24", scheduled_time: "23:00" }),
    );

    expect(result).toBe("Sat, Oct 24, 23:00");
  });

  it("says today for a game that kicks off today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-24T08:00:00.000Z"));

    const result = format_live_game_kickoff(
      create_fixture({ scheduled_date: "2026-10-24", scheduled_time: "11:00" }),
    );

    expect(result).toBe("Today, 11:00");
  });
});

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

describe("liveGamesViewLogic lookup coverage", () => {
  it("uses neutral badge classes for completed and cancelled fixtures", () => {
    expect(get_live_game_status_badge_class("completed")).toContain(
      "bg-accent-100",
    );
    expect(get_live_game_status_badge_class("cancelled")).toContain(
      "bg-accent-100",
    );
  });

  it("renders pending and passed checks without the failure container", () => {
    expect(get_live_game_check_icon("pending")).toBe("○");
    expect(get_live_game_check_icon("passed")).toBe("✓");
    expect(get_live_game_check_container_class("passed")).toBe("py-1");
    expect(get_live_game_check_class("checking")).toContain("animate-pulse");
  });

  it("falls back to default team labels when no names exist", () => {
    expect(
      get_live_game_matchup_label(
        create_fixture({ home_team_name: "", away_team_name: "" }),
        {},
      ),
    ).toBe("Home Team vs Away Team");
  });
});
