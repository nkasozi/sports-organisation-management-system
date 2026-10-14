import type { GameEvent } from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
  PLAYER_TIME_ON,
} from "$lib/core/entities/FixtureLineup";
import type { CardType } from "$lib/core/entities/Sport";
import { type Option, OptionStatus } from "$lib/core/types/Option";

import { GAME_EVENT_TYPE } from "./gameEventConstants";
import {
  resolve_event_player_id,
  resolve_event_secondary_player_id,
} from "./liveGameEventPlayerIdentity";

export type CardSeverity = CardType["severity"];

export type CardSeverityRules = ReadonlyMap<string, CardSeverity>;

const CARD_SEVERITY = {
  WARNING: "warning",
  SUSPENSION: "suspension",
  EJECTION: "ejection",
} as const satisfies Record<string, CardSeverity>;

export type PlayerAvailability = {
  on_field_ids: Set<string>;
  ejected_ids: Set<string>;
  suspended_ids: Set<string>;
  substituted_off_ids: Set<string>;
  substitutions_used: number;
};

type ReplayContext = {
  players: readonly LineupPlayer[];
  card_rules: CardSeverityRules;
};

export function build_card_severity_rules(
  card_types: readonly Pick<CardType, "id" | "severity">[],
): CardSeverityRules {
  return new Map(card_types.map((card) => [card.id, card.severity]));
}

function is_starting_player(player: LineupPlayer): boolean {
  return (
    (player.time_on ?? get_default_time_on_for_player(player.is_substitute)) !==
    PLAYER_TIME_ON.DIDNT_PLAY
  );
}

function sort_by_game_time(events: readonly GameEvent[]): GameEvent[] {
  return [...events].sort(
    (left, right) =>
      left.minute - right.minute ||
      new Date(left.recorded_at).getTime() -
        new Date(right.recorded_at).getTime(),
  );
}

function clone(availability: PlayerAvailability): PlayerAvailability {
  return {
    on_field_ids: new Set(availability.on_field_ids),
    ejected_ids: new Set(availability.ejected_ids),
    suspended_ids: new Set(availability.suspended_ids),
    substituted_off_ids: new Set(availability.substituted_off_ids),
    substitutions_used: availability.substitutions_used,
  };
}

function apply_substitution(
  availability: PlayerAvailability,
  player_on: Option<string>,
  player_off: Option<string>,
): PlayerAvailability {
  if (player_off.status === OptionStatus.SOME) {
    availability.on_field_ids.delete(player_off.value);
    availability.substituted_off_ids.add(player_off.value);
  }
  if (player_on.status === OptionStatus.NONE) return availability;
  const is_return_from_suspension = availability.suspended_ids.delete(
    player_on.value,
  );
  availability.on_field_ids.add(player_on.value);
  if (!is_return_from_suspension) availability.substitutions_used += 1;
  return availability;
}

function apply_card(
  availability: PlayerAvailability,
  severity: CardSeverity,
  player: Option<string>,
): PlayerAvailability {
  if (player.status === OptionStatus.NONE) return availability;
  switch (severity) {
    case CARD_SEVERITY.WARNING:
      return availability;
    case CARD_SEVERITY.SUSPENSION:
      availability.on_field_ids.delete(player.value);
      availability.suspended_ids.add(player.value);
      return availability;
    case CARD_SEVERITY.EJECTION:
      availability.on_field_ids.delete(player.value);
      availability.suspended_ids.delete(player.value);
      availability.ejected_ids.add(player.value);
      return availability;
  }
}

function apply_event(
  context: ReplayContext,
  current: PlayerAvailability,
  event: GameEvent,
): PlayerAvailability {
  const availability = clone(current);
  const player = resolve_event_player_id(event, context.players);
  if (event.event_type === GAME_EVENT_TYPE.SUBSTITUTION)
    return apply_substitution(
      availability,
      player,
      resolve_event_secondary_player_id(event, context.players),
    );
  const severity = context.card_rules.get(event.event_type);
  return severity ? apply_card(availability, severity, player) : availability;
}

export function derive_player_availability(
  players: readonly LineupPlayer[],
  events: readonly GameEvent[],
  team_side: GameEvent["team_side"],
  card_rules: CardSeverityRules,
): PlayerAvailability {
  const initial: PlayerAvailability = {
    on_field_ids: new Set(
      players.filter(is_starting_player).map((player) => String(player.id)),
    ),
    ejected_ids: new Set(),
    suspended_ids: new Set(),
    substituted_off_ids: new Set(),
    substitutions_used: 0,
  };
  return sort_by_game_time(
    events.filter((event) => event.team_side === team_side),
  ).reduce(
    (availability, event) =>
      apply_event({ players, card_rules }, availability, event),
    initial,
  );
}
