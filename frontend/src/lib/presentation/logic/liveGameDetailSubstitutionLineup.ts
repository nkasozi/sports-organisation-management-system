import type {
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";

import { TEAM_SIDE } from "./gameEventConstants";
import type { FixtureLineupUseCases } from "./liveGameDetailPageActionTypes";

type SubstitutionLineupChange = {
  player_on_id: string;
  player_off_id: string;
  minute: string;
};

type SubstitutionLineupCommand = {
  team_side: "home" | "away";
  home_lineup_id: string;
  away_lineup_id: string;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  change: SubstitutionLineupChange;
  fixture_lineup_use_cases: Pick<
    FixtureLineupUseCases,
    "record_live_player_times"
  >;
};

type SubstitutionLineupResult = {
  success: boolean;
  error_message: string;
  updated_home_players: LineupPlayer[];
  updated_away_players: LineupPlayer[];
};

const SUBSTITUTION_LINEUP_SAVE_FAILED_MESSAGE =
  "The substitution was recorded, but the lineup could not be updated. Please check the lineup.";
const SUBSTITUTION_LINEUP_LOG_SCOPE = "[LiveGameDetail] Substitution lineup";
const SUBSTITUTION_LINEUP_SAVE_FAILED_EVENT =
  "live_game_substitution_lineup_save_failed";

function apply_change_to_player(
  player: LineupPlayer,
  change: SubstitutionLineupChange,
): LineupPlayer {
  if (player.id === change.player_on_id)
    return { ...player, time_on: change.minute as PlayerTimeOnStatus };
  if (change.player_off_id && player.id === change.player_off_id)
    return { ...player, time_off: change.minute };
  return player;
}

export function apply_substitution_to_lineup(
  players: LineupPlayer[],
  change: SubstitutionLineupChange,
): LineupPlayer[] {
  return players.map((player) => apply_change_to_player(player, change));
}

function build_result(
  command: SubstitutionLineupCommand,
  updated_players: LineupPlayer[],
  error_message: string,
): SubstitutionLineupResult {
  const is_home = command.team_side === TEAM_SIDE.HOME;
  return {
    success: error_message.length === 0,
    error_message,
    updated_home_players: is_home ? updated_players : command.home_players,
    updated_away_players: is_home ? command.away_players : updated_players,
  };
}

export async function save_live_game_substitution_lineup(
  command: SubstitutionLineupCommand,
): Promise<SubstitutionLineupResult> {
  const is_home = command.team_side === TEAM_SIDE.HOME;
  const lineup_id = is_home ? command.home_lineup_id : command.away_lineup_id;
  const updated_players = apply_substitution_to_lineup(
    is_home ? command.home_players : command.away_players,
    command.change,
  );
  const result =
    await command.fixture_lineup_use_cases.record_live_player_times({
      lineup_id,
      selected_players: updated_players,
    });
  if (result.success) return build_result(command, updated_players, "");
  console.warn(SUBSTITUTION_LINEUP_LOG_SCOPE, {
    event: SUBSTITUTION_LINEUP_SAVE_FAILED_EVENT,
    lineup_id,
    error: result.error,
  });
  return build_result(
    command,
    updated_players,
    SUBSTITUTION_LINEUP_SAVE_FAILED_MESSAGE,
  );
}
