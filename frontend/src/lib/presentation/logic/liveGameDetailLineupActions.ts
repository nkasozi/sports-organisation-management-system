import type { Fixture } from "$lib/core/entities/Fixture";
import type {
  CreateFixtureLineupInput,
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { Team } from "$lib/core/entities/Team";
import {
  get_fixture_lineup_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

type FixtureLineupUseCases = ReturnType<typeof get_fixture_lineup_use_cases>;
type PlayerMembershipUseCases = ReturnType<
  typeof get_player_team_membership_use_cases
>;
type PlayerUseCases = ReturnType<typeof get_player_use_cases>;

export async function update_live_game_player_time_on(
  lineup_id: string,
  players: LineupPlayer[],
  player_id: string,
  new_time_on: PlayerTimeOnStatus,
  fixture_lineup_use_cases: FixtureLineupUseCases,
): Promise<
  | { success: true; updated_players: LineupPlayer[] }
  | { success: false; error_message: string; updated_players: LineupPlayer[] }
> {
  const updated_players = players.map((player) =>
    player.id === player_id ? { ...player, time_on: new_time_on } : player,
  );
  const update_result = await fixture_lineup_use_cases.update(lineup_id, {
    selected_players: updated_players,
  });
  return update_result.success
    ? { success: true, updated_players }
    : {
        success: false,
        error_message: "Failed to save player status",
        updated_players,
      };
}

export async function auto_generate_live_game_lineup(
  fixture: Fixture,
  team_id: string,
  player_membership_use_cases: PlayerMembershipUseCases,
  player_use_cases: PlayerUseCases,
  fixture_lineup_use_cases: FixtureLineupUseCases,
): Promise<boolean> {
  const memberships_result = await player_membership_use_cases.list({
    team_id,
    status: "active",
  });
  const active_memberships = (
    memberships_result.success ? memberships_result.data.items : []
  ).filter((membership: { status: string }) => membership.status === "active");
  if (active_memberships.length === 0) return false;
  const player_results = await Promise.all(
    active_memberships.map((membership: { player_id: string }) =>
      player_use_cases.get_by_id(membership.player_id),
    ),
  );
  const players = player_results.reduce<Player[]>((loaded_players, result) => {
    if (!result.success) return loaded_players;
    loaded_players.push(result.data);
    return loaded_players;
  }, []);
  const selected_players: CreateFixtureLineupInput["selected_players"] =
    active_memberships.map(
    (membership: { player_id: string; jersey_number?: number | null }) => {
      const player = players.find(
        (current_player) => current_player?.id === membership.player_id,
      );
      return {
        id: membership.player_id,
        first_name: player?.first_name || "Unknown",
        last_name: player?.last_name || "Player",
        jersey_number: membership.jersey_number ?? null,
        position: null,
        is_captain: false,
        is_substitute: false,
      };
    },
  );
  const lineup_input: CreateFixtureLineupInput = {
    organization_id: fixture.organization_id,
    fixture_id: fixture.id,
    team_id,
    selected_players,
    status: "submitted",
    submitted_by: "auto-generated",
    submitted_at: new Date().toISOString(),
    notes: "Auto-generated lineup at game start",
  };
  const create_result = await fixture_lineup_use_cases.create(lineup_input);
  return create_result.success;
}

export async function ensure_live_game_lineups_before_start(
  fixture: Fixture,
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
  home_team: Team | null,
  away_team: Team | null,
  allow_auto_submission: boolean,
  player_membership_use_cases: PlayerMembershipUseCases,
  player_use_cases: PlayerUseCases,
  fixture_lineup_use_cases: FixtureLineupUseCases,
): Promise<
  | { success: true; reloaded_required: boolean }
  | { success: false; error_message: string }
> {
  const home_lineup_missing = home_players.length === 0;
  const away_lineup_missing = away_players.length === 0;
  if (!home_lineup_missing && !away_lineup_missing)
    return { success: true, reloaded_required: false };
  if (!allow_auto_submission)
    return {
      success: false,
      error_message:
        home_lineup_missing && away_lineup_missing
          ? `Both teams (${home_team?.name || "Home Team"} and ${away_team?.name || "Away Team"}) have not submitted their squads for this fixture. Please submit lineups before starting the game.`
          : home_lineup_missing
            ? `${home_team?.name || "Home Team"} has not submitted their squad for this fixture. Please submit lineups before starting the game.`
            : `${away_team?.name || "Away Team"} has not submitted their squad for this fixture. Please submit lineups before starting the game.`,
    };
  if (
    home_lineup_missing &&
    !(await auto_generate_live_game_lineup(
      fixture,
      fixture.home_team_id,
      player_membership_use_cases,
      player_use_cases,
      fixture_lineup_use_cases,
    ))
  )
    return {
      success: false,
      error_message: `Failed to auto-generate lineup for ${home_team?.name || "Home Team"}`,
    };
  if (
    away_lineup_missing &&
    !(await auto_generate_live_game_lineup(
      fixture,
      fixture.away_team_id,
      player_membership_use_cases,
      player_use_cases,
      fixture_lineup_use_cases,
    ))
  )
    return {
      success: false,
      error_message: `Failed to auto-generate lineup for ${away_team?.name || "Away Team"}`,
    };
  return { success: true, reloaded_required: true };
}
