import { describe, expect, it } from "vitest";

import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  build_player_assignments,
  count_selected_players,
  filter_player_assignments_by_name,
  filter_player_assignments_by_team_gender,
} from "./bulkPlayerAssignmentPageState";

function create_test_player(
  overrides: Partial<ScalarInput<Player>> = {},
): Player {
  return {
    id: overrides.id ?? "player_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    first_name: overrides.first_name ?? "Alex",
    last_name: overrides.last_name ?? "Morgan",
    gender_id: overrides.gender_id ?? "gender_women",
    email: overrides.email ?? "",
    phone: overrides.phone ?? "",
    date_of_birth: overrides.date_of_birth ?? "1990-01-01",
    position_id: overrides.position_id ?? "position_1",
    organization_id: overrides.organization_id ?? "org_1",
    height_cm: overrides.height_cm ?? null,
    weight_kg: overrides.weight_kg ?? null,
    nationality: overrides.nationality ?? "UG",
    profile_image_url: overrides.profile_image_url ?? "",
    emergency_contact_name: overrides.emergency_contact_name ?? "",
    emergency_contact_phone: overrides.emergency_contact_phone ?? "",
    medical_notes: overrides.medical_notes ?? "",
    status: overrides.status ?? "active",
  } as unknown as Player;
}

function create_test_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
  return {
    id: overrides.id ?? "team_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Blue Stars",
    short_name: overrides.short_name ?? "BST",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "org_1",
    gender_id: overrides.gender_id ?? "gender_women",
    captain_player_id: overrides.captain_player_id ?? null,
    vice_captain_player_id: overrides.vice_captain_player_id ?? null,
    max_squad_size: overrides.max_squad_size ?? 25,
    home_venue_id: overrides.home_venue_id ?? "venue_1",
    primary_color: overrides.primary_color ?? "#0000FF",
    secondary_color: overrides.secondary_color ?? "#FFFFFF",
    logo_url: overrides.logo_url ?? "",
    website: overrides.website ?? "",
    founded_year: overrides.founded_year ?? 2020,
    status: overrides.status ?? "active",
  } as unknown as Team;
}

function create_test_membership(
  overrides: Partial<ScalarInput<PlayerTeamMembership>> = {},
): PlayerTeamMembership {
  return {
    id: overrides.id ?? "membership_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "org_1",
    player_id: overrides.player_id ?? "player_1",
    team_id: overrides.team_id ?? "team_1",
    start_date: overrides.start_date ?? "2024-01-01",
    jersey_number: overrides.jersey_number ?? 10,
    status: overrides.status ?? "active",
  } as unknown as PlayerTeamMembership;
}

describe("build_player_assignments", () => {
  it("adds active membership details and sequential jersey defaults", () => {
    const players = [
      create_test_player({
        id: "player_1",
        first_name: "Alex",
        last_name: "Morgan",
      }),
      create_test_player({
        id: "player_2",
        first_name: "Sam",
        last_name: "Kerr",
        gender_id: "",
      }),
    ];
    const teams = [create_test_team({ id: "team_1", name: "Blue Stars" })];
    const memberships = [
      create_test_membership({
        player_id: "player_1",
        team_id: "team_1",
        status: "active",
      }),
      create_test_membership({
        id: "membership_2",
        player_id: "player_2",
        team_id: "team_1",
        status: "ended",
      }),
    ];

    const assignments = build_player_assignments(
      players,
      memberships,
      teams,
      "2024-04-05",
    );

    expect(assignments).toHaveLength(2);
    expect(assignments[0].current_team_id).toBe("team_1");
    expect(assignments[0].current_team_name).toBe("Blue Stars");
    expect(assignments[0].jersey_number).toBe(1);
    expect(assignments[0].start_date).toBe("2024-04-05");
    expect(assignments[1].current_team_id).toBeNull();
    expect(assignments[1].current_team_name).toBeNull();
    expect(assignments[1].jersey_number).toBe(2);
  });
});

describe("filter_player_assignments_by_team_gender", () => {
  it("keeps players matching the team gender and players without a gender", () => {
    const assignments = build_player_assignments(
      [
        create_test_player({ id: "player_1", gender_id: "gender_women" }),
        create_test_player({ id: "player_2", gender_id: "gender_men" }),
        create_test_player({ id: "player_3", gender_id: "" }),
      ],
      [],
      [],
      "2024-04-05",
    );

    const filtered_assignments = filter_player_assignments_by_team_gender(
      assignments,
      create_test_team({ gender_id: "gender_women" }),
    );

    expect(
      filtered_assignments.map(
        (current_assignment) => current_assignment.player.id,
      ),
    ).toEqual(["player_1", "player_3"]);
  });

  it("returns all assignments when the selected team has no gender", () => {
    const assignments = build_player_assignments(
      [
        create_test_player({ id: "player_1" }),
        create_test_player({ id: "player_2" }),
      ],
      [],
      [],
      "2024-04-05",
    );

    expect(
      filter_player_assignments_by_team_gender(
        assignments,
        create_test_team({ gender_id: "" }),
      ),
    ).toHaveLength(2);
  });
});

describe("filter_player_assignments_by_name", () => {
  it("matches full names case-insensitively", () => {
    const assignments = build_player_assignments(
      [
        create_test_player({
          id: "player_1",
          first_name: "Alex",
          last_name: "Morgan",
        }),
        create_test_player({
          id: "player_2",
          first_name: "Casey",
          last_name: "Stoney",
        }),
      ],
      [],
      [],
      "2024-04-05",
    );

    expect(
      filter_player_assignments_by_name(assignments, "morgan").map(
        (current_assignment) => current_assignment.player.id,
      ),
    ).toEqual(["player_1"]);
  });
});

describe("count_selected_players", () => {
  it("counts selected assignments across multiple groups", () => {
    const assignments = build_player_assignments(
      [
        create_test_player({ id: "player_1" }),
        create_test_player({ id: "player_2" }),
      ],
      [],
      [],
      "2024-04-05",
    );

    assignments[0].selected = true;
    assignments[1].selected = true;

    expect(count_selected_players([assignments[0]], [assignments[1]])).toBe(2);
  });
});
