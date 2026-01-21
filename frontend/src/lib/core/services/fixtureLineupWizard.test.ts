import { describe, expect, it } from "vitest";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import {
  build_error_message,
  derive_initial_selected_player_ids,
  derive_initial_selected_players,
  convert_team_player_to_lineup_player,
  convert_team_players_to_lineup_players,
  summarize_selected_team_players,
  sort_lineup_players,
} from "./fixtureLineupWizard";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";

describe("fixtureLineupWizard", () => {
  it("builds a cause/solution style error message", () => {
    const message = build_error_message(
      "No fixtures available",
      "A fixture is required to submit a lineup",
      "Create a fixture first, then return here",
    );

    expect(message).toContain("No fixtures available");
    expect(message).toContain("Why:");
    expect(message).toContain("How to fix:");
  });

  it("derives initial selected player ids capped by max", () => {
    const players: TeamPlayer[] = [
      { id: "p1" } as TeamPlayer,
      { id: "p2" } as TeamPlayer,
      { id: "p3" } as TeamPlayer,
    ];

    expect(derive_initial_selected_player_ids(players, 2)).toEqual([
      "p1",
      "p2",
    ]);
    expect(derive_initial_selected_player_ids(players, 10)).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
  });

  it("derives initial selected players with full info", () => {
    const players: TeamPlayer[] = [
      { id: "p1", first_name: "John", last_name: "Doe", jersey_number: 10, position: "Forward" } as TeamPlayer,
      { id: "p2", first_name: "Jane", last_name: "Smith", jersey_number: 7, position: "Midfielder" } as TeamPlayer,
    ];

    const result = derive_initial_selected_players(players, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
    expect(result[0].first_name).toBe("John");
    expect(result[0].jersey_number).toBe(10);
  });

  it("converts team player to lineup player", () => {
    const team_player: TeamPlayer = {
      id: "p1",
      first_name: "John",
      last_name: "Doe",
      jersey_number: 10,
      position: "Forward",
    } as TeamPlayer;

    const lineup_player = convert_team_player_to_lineup_player(team_player, true, false);
    expect(lineup_player.id).toBe("p1");
    expect(lineup_player.first_name).toBe("John");
    expect(lineup_player.is_captain).toBe(true);
    expect(lineup_player.is_substitute).toBe(false);
  });

  it("converts team players to lineup players by ids", () => {
    const players: TeamPlayer[] = [
      { id: "p1", first_name: "A", last_name: "One", jersey_number: 1, position: "GK" } as TeamPlayer,
      { id: "p2", first_name: "B", last_name: "Two", jersey_number: 2, position: "DF" } as TeamPlayer,
    ];

    const result = convert_team_players_to_lineup_players(players, ["p2"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2");
  });

  it("summarizes selected players sorted by jersey then name", () => {
    const players: TeamPlayer[] = [
      {
        id: "p2",
        first_name: "B",
        last_name: "Two",
        jersey_number: 10,
        position: "Midfielder",
      } as TeamPlayer,
      {
        id: "p1",
        first_name: "A",
        last_name: "One",
        jersey_number: 7,
        position: "Forward",
      } as TeamPlayer,
      {
        id: "p3",
        first_name: "C",
        last_name: "Three",
        jersey_number: null,
        position: null,
      } as TeamPlayer,
    ];

    const summary = summarize_selected_team_players(players, [
      "p3",
      "p1",
      "p2",
    ]);
    expect(summary.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("sorts lineup players by jersey then name", () => {
    const players: LineupPlayer[] = [
      { id: "p2", first_name: "B", last_name: "Two", jersey_number: 10, position: "MF", is_captain: false, is_substitute: false },
      { id: "p1", first_name: "A", last_name: "One", jersey_number: 7, position: "FW", is_captain: false, is_substitute: false },
      { id: "p3", first_name: "C", last_name: "Three", jersey_number: null, position: null, is_captain: false, is_substitute: false },
    ];

    const sorted = sort_lineup_players(players);
    expect(sorted.map(p => p.id)).toEqual(["p1", "p2", "p3"]);
  });
});
