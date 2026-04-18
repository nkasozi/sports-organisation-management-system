import { describe, expect, it, vi } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type FixtureLineupDetailPageDependencies,
  load_fixture_lineup_detail_page_data,
} from "./fixtureLineupDetailPageLoad";

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

function create_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
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
    captain_player_id: "",
    vice_captain_player_id: "",
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

function create_player(overrides: Partial<ScalarInput<Player>> = {}): Player {
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
    height_cm: 0,
    weight_kg: 0,
    nationality: "UG",
    profile_image_url: "",
    emergency_contact_name: "Coach",
    emergency_contact_phone: "123",
    medical_notes: "",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Player;
}

function create_membership(
  overrides: Partial<ScalarInput<PlayerTeamMembership>> = {},
): PlayerTeamMembership {
  return {
    id: "membership_1",
    organization_id: "org_1",
    player_id: "player_1",
    team_id: "team_1",
    start_date: "2026-01-01",
    jersey_number: 9,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerTeamMembership;
}

function create_position(
  overrides: Partial<ScalarInput<PlayerPosition>> = {},
): PlayerPosition {
  return {
    id: "position_1",
    name: "Forward",
    code: "FW",
    category: "forward",
    description: "",
    sport_type: "Football",
    display_order: 1,
    is_available: true,
    status: "active",
    organization_id: "org_1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerPosition;
}

function create_paginated_result<TData>(items: TData[]) {
  return create_success_result({
    items,
    total_count: items.length,
    page_number: 1,
    page_size: items.length || 1,
    total_pages: 1,
  });
}

function create_dependencies(
  overrides: Partial<FixtureLineupDetailPageDependencies> = {},
): FixtureLineupDetailPageDependencies {
  return {
    get_fixture_lineup_by_id: async () =>
      create_success_result(create_lineup()),
    get_fixture_by_id: async () => create_success_result(create_fixture()),
    get_team_by_id: async (team_id: string) =>
      create_success_result(
        create_team({
          id: team_id,
          name:
            team_id === "team_home"
              ? "Lions"
              : team_id === "team_away"
                ? "Tigers"
                : "Squad",
        }),
      ),
    list_players_by_team: async () =>
      create_paginated_result([create_player()]),
    list_memberships_by_team: async () =>
      create_paginated_result([create_membership()]),
    list_positions: async () => create_paginated_result([create_position()]),
    ...overrides,
  } as FixtureLineupDetailPageDependencies;
}

describe("load_fixture_lineup_detail_page_data", () => {
  it("returns a failure result when the lineup cannot be found", async () => {
    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "missing",
      organization_scope_state: { status: "scoped", organization_id: "org_1" },
      dependencies: create_dependencies({
        get_fixture_lineup_by_id: async () =>
          create_failure_result("Lineup not found"),
      }),
    });

    expect(result.success).toBe(false);
    expect(result).toEqual({ success: false, error: "Lineup not found" });
  });

  it("passes the organization filter to positions and builds the derived team players", async () => {
    const list_positions = vi.fn(async () =>
      create_paginated_result([create_position()]),
    );

    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "lineup_1",
      organization_scope_state: { status: "scoped", organization_id: "org_1" },
      dependencies: create_dependencies({ list_positions }),
    });

    expect(list_positions).toHaveBeenCalledWith(
      { organization_id: "org_1" },
      { page_number: 1, page_size: 500 },
    );
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.team_players).toHaveLength(1);
    expect(result.data.team_players[0].position).toBe("Forward");
    expect(result.data.home_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Lions" }),
    });
    expect(result.data.away_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Tigers" }),
    });
  });

  it("keeps loading without fixture or team lookup success and omits the position filter when unscoped", async () => {
    const list_positions = vi.fn(async () =>
      create_paginated_result([create_position()]),
    );

    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "lineup_1",
      organization_scope_state: { status: "unscoped" },
      dependencies: create_dependencies({
        get_fixture_by_id: async () => create_failure_result("missing fixture"),
        get_team_by_id: async () => create_failure_result("missing team"),
        list_positions,
      }),
    });

    expect(list_positions).toHaveBeenCalledWith(void 0, {
      page_number: 1,
      page_size: 500,
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.fixture_state).toEqual({ status: "missing" });
    expect(result.data.team_state).toEqual({ status: "missing" });
    expect(result.data.home_team_state).toEqual({ status: "missing" });
    expect(result.data.away_team_state).toEqual({ status: "missing" });
  });
});
