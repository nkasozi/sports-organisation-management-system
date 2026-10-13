import type { GameEvent } from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
  PLAYER_TIME_ON,
} from "$lib/core/entities/FixtureLineup";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { GAME_EVENT_TYPE } from "./gameEventConstants";
import {
  resolve_event_player_id,
  resolve_event_secondary_player_id,
} from "./liveGameEventPlayerIdentity";

type PlayingTeamSide = GameEvent["team_side"];

type SubstitutionCheck = {
  on_field_players: LineupPlayer[];
  player_on_id: string;
  player_off_id: string;
  max_players_on_field: number;
};

const SUBSTITUTION_MESSAGE = {
  PLAYER_ON_REQUIRED: "Choose the player coming on.",
  PLAYER_ON_ALREADY_PLAYING:
    "The player coming on is already on the field. Choose a substitute instead.",
  PLAYER_OFF_NOT_PLAYING:
    "The player coming off is not on the field. Choose a player who is currently playing.",
  FIELD_FULL:
    "The team already has the maximum number of players on the field. Choose the player coming off.",
} as const;

function sort_by_game_time(events: GameEvent[]): GameEvent[] {
  return [...events].sort(
    (left, right) =>
      left.minute - right.minute ||
      new Date(left.recorded_at).getTime() -
        new Date(right.recorded_at).getTime(),
  );
}

const DISMISSAL_EVENT_TYPES: ReadonlySet<string> = new Set([
  GAME_EVENT_TYPE.RED_CARD,
  GAME_EVENT_TYPE.SECOND_YELLOW,
]);

type FieldReplayContext = { players: readonly LineupPlayer[] };

function with_player(
  on_field_ids: Set<string>,
  player_id: Option<string>,
): Set<string> {
  if (player_id.status === OptionStatus.SOME) on_field_ids.add(player_id.value);
  return on_field_ids;
}

function without_player(
  on_field_ids: Set<string>,
  player_id: Option<string>,
): Set<string> {
  if (player_id.status === OptionStatus.SOME)
    on_field_ids.delete(player_id.value);
  return on_field_ids;
}

function apply_event_to_field(
  context: FieldReplayContext,
  on_field_ids: Set<string>,
  event: GameEvent,
): Set<string> {
  const next_ids = new Set(on_field_ids);
  if (event.event_type === GAME_EVENT_TYPE.SUBSTITUTION)
    return with_player(
      without_player(
        next_ids,
        resolve_event_secondary_player_id(event, context.players),
      ),
      resolve_event_player_id(event, context.players),
    );
  if (DISMISSAL_EVENT_TYPES.has(event.event_type))
    return without_player(
      next_ids,
      resolve_event_player_id(event, context.players),
    );
  return next_ids;
}

function is_starting_player(player: LineupPlayer): boolean {
  return (
    (player.time_on ?? get_default_time_on_for_player(player.is_substitute)) !==
    PLAYER_TIME_ON.DIDNT_PLAY
  );
}

function team_events(
  events: GameEvent[],
  team_side: PlayingTeamSide,
): GameEvent[] {
  return sort_by_game_time(
    events.filter((event) => event.team_side === team_side),
  );
}

export function derive_on_field_players(
  players: LineupPlayer[],
  events: GameEvent[],
  team_side: PlayingTeamSide,
): LineupPlayer[] {
  const context: FieldReplayContext = { players };
  const starting_ids = new Set(
    players.filter(is_starting_player).map((player) => String(player.id)),
  );
  const on_field_ids = team_events(events, team_side).reduce(
    (current_ids, event) => apply_event_to_field(context, current_ids, event),
    starting_ids,
  );
  return players.filter((player) => on_field_ids.has(String(player.id)));
}

export function derive_dismissed_player_ids(
  players: LineupPlayer[],
  events: GameEvent[],
  team_side: PlayingTeamSide,
): Set<string> {
  return team_events(events, team_side)
    .filter((event) => DISMISSAL_EVENT_TYPES.has(event.event_type))
    .reduce(
      (dismissed_ids, event) =>
        with_player(dismissed_ids, resolve_event_player_id(event, players)),
      new Set<string>(),
    );
}

function is_on_field(players: LineupPlayer[], player_id: string): boolean {
  return players.some((player) => player.id === player_id);
}

export function validate_substitution(
  check: SubstitutionCheck,
): Result<boolean, string> {
  if (!check.player_on_id)
    return create_failure_result(SUBSTITUTION_MESSAGE.PLAYER_ON_REQUIRED);
  if (is_on_field(check.on_field_players, check.player_on_id))
    return create_failure_result(
      SUBSTITUTION_MESSAGE.PLAYER_ON_ALREADY_PLAYING,
    );
  if (
    check.player_off_id &&
    !is_on_field(check.on_field_players, check.player_off_id)
  )
    return create_failure_result(SUBSTITUTION_MESSAGE.PLAYER_OFF_NOT_PLAYING);
  if (
    !check.player_off_id &&
    check.on_field_players.length >= check.max_players_on_field
  )
    return create_failure_result(SUBSTITUTION_MESSAGE.FIELD_FULL);
  return create_success_result(true);
}
