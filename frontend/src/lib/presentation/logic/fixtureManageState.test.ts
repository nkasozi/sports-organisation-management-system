import { describe, expect, it } from "vitest";

import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";

import {
  build_position_name_by_id_map,
  build_team_players,
  filter_team_players,
  format_team_player_option,
  has_team_submitted_lineup,
  pick_best_membership_for_player,
} from "./fixtureManageState";

function create_test_player(overrides: Partial<Player>): Player {
  return {
    id: overrides.id ?? "player_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    first_name: overrides.first_name ?? "Ada",
    last_name: overrides.last_name ?? "Nimble",
    gender_id: overrides.gender_id ?? "gender_1",
    email: overrides.email ?? "ada@example.com",
    phone: overrides.phone ?? "",
    date_of_birth: overrides.date_of_birth ?? "2000-01-01",
    position_id: overrides.position_id ?? "position_1",
    organization_id: overrides.organization_id ?? "organization_1",
    height_cm: overrides.height_cm ?? null,
    weight_kg: overrides.weight_kg ?? null,
    nationality: overrides.nationality ?? "UG",
    profile_image_url: overrides.profile_image_url ?? "",
    emergency_contact_name: overrides.emergency_contact_name ?? "",
    emergency_contact_phone: overrides.emergency_contact_phone ?? "",
    medical_notes: overrides.medical_notes ?? "",
    status: overrides.status ?? "active",
  };
}

function create_test_membership(
  overrides: Partial<PlayerTeamMembership>,
): PlayerTeamMembership {
  return {
    id: overrides.id ?? "membership_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "organization_1",
    player_id: overrides.player_id ?? "player_1",
    team_id: overrides.team_id ?? "team_1",
    start_date: overrides.start_date ?? "2024-01-01",
    jersey_number: overrides.jersey_number ?? 7,
    status: overrides.status ?? "active",
  };
}

function create_test_lineup(overrides: Partial<FixtureLineup>): FixtureLineup {
  return {
    id: overrides.id ?? "lineup_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "organization_1",
    fixture_id: overrides.fixture_id ?? "fixture_1",
    team_id: overrides.team_id ?? "team_1",
    selected_players: overrides.selected_players ?? [],
    status: overrides.status ?? "submitted",
    submitted_by: overrides.submitted_by ?? "user_1",
    submitted_at: overrides.submitted_at ?? "2024-01-01T00:00:00.000Z",
    notes: overrides.notes ?? "",
  };
}

describe("fixture manage roster helpers", () => {
  it("prefers the active membership when multiple records exist", () => {
    expect(
      pick_best_membership_for_player(
        [
          create_test_membership({ id: "membership_1", status: "inactive" }),
          create_test_membership({
            id: "membership_2",
            status: "active",
            start_date: "2024-02-01",
          }),
        ],
        "player_1",
      )?.id,
    ).toBe("membership_2");
  });

  it("builds roster players with jersey numbers and position names", () => {
    const players = [create_test_player({})];
    const memberships = [create_test_membership({ jersey_number: 11 })];
    const position_map = build_position_name_by_id_map([
      { id: "position_1", name: "Forward" },
    ]);

    expect(build_team_players(players, memberships, position_map)).toEqual([
      expect.objectContaining({ jersey_number: 11, position: "Forward" }),
    ]);
  });

  it("formats and filters team players for the event search", () => {
    const team_players = [
      {
        ...create_test_player({ first_name: "Ada", last_name: "Nimble" }),
        jersey_number: 9,
        position: "Forward",
      },
      {
        ...create_test_player({
          id: "player_2",
          first_name: "Beth",
          last_name: "Shield",
        }),
        jersey_number: 4,
        position: "Defender",
      },
    ];

    expect(format_team_player_option(team_players[0])).toBe(
      "#9 Ada Nimble • Forward",
    );
    expect(filter_team_players(team_players, "defend")).toEqual([
      team_players[1],
    ]);
  });
});

describe("fixture manage lineup helpers", () => {
  it("recognizes submitted or locked lineups for a team", () => {
    expect(
      has_team_submitted_lineup(
        [
          create_test_lineup({ team_id: "team_1", status: "draft" }),
          create_test_lineup({ id: "lineup_2", team_id: "team_2" }),
        ],
        "team_2",
      ),
    ).toBe(true);
  });
});
