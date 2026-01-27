import { describe, expect, it } from "vitest";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import {
  build_position_name_by_id,
  build_team_players,
  format_team_player_label,
  matches_team_player_search,
  pick_best_membership_for_player,
} from "./teamPlayers";

describe("teamPlayers", () => {
  function create_player(overrides: Partial<Player>): Player {
    return {
      id: "player_default",
      created_at: "",
      updated_at: "",
      first_name: "First",
      last_name: "Last",
      email: "test@example.com",
      phone: "+000",
      date_of_birth: "2000-01-01",
      position_id: "",
      height_cm: null,
      weight_kg: null,
      nationality: "Uganda",
      profile_image_url: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      medical_notes: "",
      status: "active",
      ...overrides,
    };
  }

  it("picks an active membership when present", () => {
    const memberships: PlayerTeamMembership[] = [
      {
        id: "m1",
        created_at: "",
        updated_at: "",
        player_id: "p1",
        team_id: "t1",
        start_date: "2024-01-01",
        jersey_number: 10,
        status: "inactive",
      },
      {
        id: "m2",
        created_at: "",
        updated_at: "",
        player_id: "p1",
        team_id: "t1",
        start_date: "2025-01-01",
        jersey_number: 9,
        status: "active",
      },
    ];

    const best = pick_best_membership_for_player(memberships, "p1");
    expect(best?.id).toBe("m2");
  });

  it("falls back to most recent start_date when no active membership", () => {
    const memberships: PlayerTeamMembership[] = [
      {
        id: "m1",
        created_at: "",
        updated_at: "",
        player_id: "p1",
        team_id: "t1",
        start_date: "2024-01-01",
        jersey_number: 10,
        status: "ended",
      },
      {
        id: "m2",
        created_at: "",
        updated_at: "",
        player_id: "p1",
        team_id: "t1",
        start_date: "2025-01-01",
        jersey_number: 9,
        status: "inactive",
      },
    ];

    const best = pick_best_membership_for_player(memberships, "p1");
    expect(best?.id).toBe("m2");
  });

  it("builds team players with jersey + position name", () => {
    const players: Player[] = [
      create_player({
        id: "p1",
        first_name: "John",
        last_name: "Doe",
        position_id: "pos1",
      }),
    ];

    const memberships: PlayerTeamMembership[] = [
      {
        id: "m1",
        created_at: "",
        updated_at: "",
        player_id: "p1",
        team_id: "t1",
        start_date: "2025-01-01",
        jersey_number: 7,
        status: "active",
      },
    ];

    const positions: PlayerPosition[] = [
      {
        id: "pos1",
        created_at: "",
        updated_at: "",
        name: "Goalkeeper",
        code: "GK",
        category: "goalkeeper",
        description: "",
        sport_type: "Football",
        display_order: 1,
        is_available: true,
        status: "active",
      },
    ];

    const map = build_position_name_by_id(positions);
    const team_players = build_team_players(players, memberships, map);

    expect(team_players[0].jersey_number).toBe(7);
    expect(team_players[0].position).toBe("Goalkeeper");
  });

  it("formats a player label with jersey and position", () => {
    const label = format_team_player_label({
      ...create_player({
        id: "p1",
        first_name: "John",
        last_name: "Doe",
        position_id: "pos1",
      }),
      jersey_number: 10,
      position: "Forward",
    });

    expect(label).toBe("#10 John Doe • Forward");
  });

  it("matches search by jersey, name, or position", () => {
    const player = {
      ...create_player({
        id: "p1",
        first_name: "John",
        last_name: "Doe",
        position_id: "pos1",
      }),
      jersey_number: 10,
      position: "Forward",
    };

    expect(matches_team_player_search(player, "10")).toBe(true);
    expect(matches_team_player_search(player, "doe")).toBe(true);
    expect(matches_team_player_search(player, "forw")).toBe(true);
    expect(matches_team_player_search(player, "zzz")).toBe(false);
  });
});
