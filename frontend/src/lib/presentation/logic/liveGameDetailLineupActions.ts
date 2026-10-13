import type { Fixture } from "$lib/core/entities/Fixture";
import type {
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";

import {
  auto_generate_live_game_lineup,
  type FixtureLineupUseCases,
  type PlayerMembershipUseCases,
  type PlayerUseCases,
} from "./liveGameDetailLineupAutoGeneration";

export { auto_generate_live_game_lineup } from "./liveGameDetailLineupAutoGeneration";

const DEFAULT_HOME_TEAM_NAME = "Home Team";
const DEFAULT_AWAY_TEAM_NAME = "Away Team";
const SUBMIT_LINEUPS_INSTRUCTION =
  "Please submit lineups before starting the game.";
const SAVE_PLAYER_STATUS_FAILED_MESSAGE = "Failed to save player status";

type LineupAutoGenerationDependencies = {
  player_membership_use_cases: PlayerMembershipUseCases;
  player_use_cases: PlayerUseCases;
  fixture_lineup_use_cases: FixtureLineupUseCases;
};

type EnsureLineupsResult =
  | { success: true; reloaded_required: boolean }
  | { success: false; error_message: string };

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
        error_message: SAVE_PLAYER_STATUS_FAILED_MESSAGE,
        updated_players,
      };
}

function build_missing_squads_message(
  home_lineup_missing: boolean,
  away_lineup_missing: boolean,
  home_team_name: string,
  away_team_name: string,
): string {
  if (home_lineup_missing && away_lineup_missing)
    return `Both teams (${home_team_name} and ${away_team_name}) have not submitted their squads for this fixture. ${SUBMIT_LINEUPS_INSTRUCTION}`;
  const missing_team_name = home_lineup_missing
    ? home_team_name
    : away_team_name;
  return `${missing_team_name} has not submitted their squad for this fixture. ${SUBMIT_LINEUPS_INSTRUCTION}`;
}

async function auto_generate_missing_lineups(
  fixture: Fixture,
  missing_lineups: { home: boolean; away: boolean },
  team_names: { home: string; away: string },
  dependencies: LineupAutoGenerationDependencies,
): Promise<EnsureLineupsResult> {
  const sides = [
    {
      is_missing: missing_lineups.home,
      team_id: fixture.home_team_id,
      team_name: team_names.home,
    },
    {
      is_missing: missing_lineups.away,
      team_id: fixture.away_team_id,
      team_name: team_names.away,
    },
  ];
  for (const side of sides) {
    if (!side.is_missing) continue;
    const lineup_generated = await auto_generate_live_game_lineup(
      fixture,
      side.team_id,
      dependencies.player_membership_use_cases,
      dependencies.player_use_cases,
      dependencies.fixture_lineup_use_cases,
    );
    if (!lineup_generated)
      return {
        success: false,
        error_message: `Failed to auto-generate lineup for ${side.team_name}`,
      };
  }
  return { success: true, reloaded_required: true };
}

export async function ensure_live_game_lineups_before_start(
  fixture: Fixture,
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
  home_team: Team | undefined,
  away_team: Team | undefined,
  allow_auto_submission: boolean,
  player_membership_use_cases: PlayerMembershipUseCases,
  player_use_cases: PlayerUseCases,
  fixture_lineup_use_cases: FixtureLineupUseCases,
): Promise<EnsureLineupsResult> {
  const missing_lineups = {
    home: home_players.length === 0,
    away: away_players.length === 0,
  };
  if (!missing_lineups.home && !missing_lineups.away)
    return { success: true, reloaded_required: false };
  const team_names = {
    home: home_team?.name || DEFAULT_HOME_TEAM_NAME,
    away: away_team?.name || DEFAULT_AWAY_TEAM_NAME,
  };
  if (!allow_auto_submission)
    return {
      success: false,
      error_message: build_missing_squads_message(
        missing_lineups.home,
        missing_lineups.away,
        team_names.home,
        team_names.away,
      ),
    };
  return auto_generate_missing_lineups(fixture, missing_lineups, team_names, {
    player_membership_use_cases,
    player_use_cases,
    fixture_lineup_use_cases,
  });
}
