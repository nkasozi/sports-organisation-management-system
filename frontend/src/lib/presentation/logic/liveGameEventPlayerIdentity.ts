import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import {
  read_event_player_id,
  read_event_secondary_player_id,
} from "$lib/core/entities/GameEventStoredFacts";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

function build_lineup_player_name(player: LineupPlayer): string {
  return `${player.first_name} ${player.last_name}`;
}

function find_player_id_by_name(
  player_name: string,
  players: readonly LineupPlayer[],
): Option<string> {
  if (!player_name) return create_none_option();
  const matching_player = players.find(
    (player) => build_lineup_player_name(player) === player_name,
  );
  return matching_player
    ? create_some_option(String(matching_player.id))
    : create_none_option();
}

function resolve_player_id(
  stored_id: Option<string>,
  player_name: string,
  players: readonly LineupPlayer[],
): Option<string> {
  return stored_id.status === OptionStatus.SOME
    ? create_some_option(String(stored_id.value))
    : find_player_id_by_name(player_name, players);
}

export function resolve_event_player_id(
  event: GameEvent,
  players: readonly LineupPlayer[],
): Option<string> {
  return resolve_player_id(
    read_event_player_id(event),
    event.player_name,
    players,
  );
}

export function resolve_event_secondary_player_id(
  event: GameEvent,
  players: readonly LineupPlayer[],
): Option<string> {
  return resolve_player_id(
    read_event_secondary_player_id(event),
    event.secondary_player_name,
    players,
  );
}
