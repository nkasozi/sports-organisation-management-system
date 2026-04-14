import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  build_fixture_lineup_permission_info_message,
  build_fixture_lineup_selected_player_ids,
  format_fixture_lineup_submission_date,
  get_fixture_lineup_name,
  get_fixture_lineup_status_class,
  toggle_fixture_lineup_player_selection,
} from "./fixtureLineupDetailPageState";

function create_lineup(
  overrides: Partial<ScalarInput<FixtureLineup>> = {},
): FixtureLineup {
  return {
    id: "lineup_1",
    organization_id: "org_1",
    fixture_id: "fixture_1",
    team_id: "team_1",
    selected_players: [],
    status: "draft",
    submitted_by: "Coach 1",
    submitted_at: "2026-01-01T00:00:00Z",
    notes: "Ready",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as FixtureLineup;
}

function create_team_player(
  overrides: Partial<ScalarInput<TeamPlayer>> = {},
): TeamPlayer {
  return {
    id: "player_1",
    first_name: "Jordan",
    last_name: "Miles",
    gender_id: "gender_1",
    email: "player@example.com",
    phone: "123",
    date_of_birth: "2000-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: null,
    weight_kg: null,
    nationality: "UG",
    profile_image_url: "",
    emergency_contact_name: "Coach",
    emergency_contact_phone: "123",
    medical_notes: "",
    status: "active",
    jersey_number: 9,
    position: "Forward",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as TeamPlayer;
}

function create_fixture(overrides: Partial<ScalarInput<Fixture>> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    stage_id: "stage_1",
    home_team_id: "team_home",
    away_team_id: "team_away",
    home_team_name: "Lions",
    away_team_name: "Tigers",
    scheduled_date: "2026-01-01",
    scheduled_time: "10:00",
    status: "scheduled",
    match_day: 1,
    manual_importance_override: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

function create_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
  return {
    id: "team_1",
    name: "Lions",
    short_name: "LIO",
    description: "",
    organization_id: "org_1",
    gender_id: "gender_1",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "venue_1",
    primary_color: "#000000",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Team;
}

describe("fixtureLineupDetailPageState", () => {
  it("builds selected player ids from the lineup", () => {
    const result = build_fixture_lineup_selected_player_ids(
      create_lineup({
        selected_players: [
          { ...create_team_player(), is_captain: false, is_substitute: false },
        ] as FixtureLineup["selected_players"],
      }),
    );

    expect(Array.from(result)).toEqual(["player_1"]);
  });

  it("toggles player selection without mutating the existing lineup", () => {
    const existing_lineup = create_lineup();
    const result = toggle_fixture_lineup_player_selection(
      existing_lineup,
      [create_team_player()],
      "player_1",
    );

    expect(existing_lineup.selected_players).toHaveLength(0);
    expect(result.selected_players).toHaveLength(1);
    expect(result.selected_players[0].id).toBe("player_1");
  });

  it("builds a fixture label from the home and away teams", () => {
    const result = get_fixture_lineup_name(
      create_fixture(),
      create_team({ id: "team_home", name: "Lions" }),
      create_team({ id: "team_away", name: "Tigers" }),
    );

    expect(result).toBe("Lions vs Tigers");
    expect(get_fixture_lineup_status_class("draft")).toBe("status-warning");
    expect(get_fixture_lineup_status_class("locked")).toBe("status-inactive");
  });

  it("formats submission dates and permission messages with fallbacks", () => {
    expect(format_fixture_lineup_submission_date("")).toBe("-");
    expect(build_fixture_lineup_permission_info_message(undefined)).toContain(
      '"unknown"',
    );
    expect(
      build_fixture_lineup_permission_info_message("team_manager"),
    ).toContain('"team_manager"');
  });
});
