import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";

import {
  type CardSeverityRules,
  derive_player_availability,
} from "./liveGamePlayerAvailability";

export { validate_substitution } from "./liveGameSubstitutionRules";

type PlayingTeamSide = GameEvent["team_side"];

export function derive_on_field_players(
  players: LineupPlayer[],
  events: GameEvent[],
  team_side: PlayingTeamSide,
  card_rules: CardSeverityRules,
): LineupPlayer[] {
  const availability = derive_player_availability(
    players,
    events,
    team_side,
    card_rules,
  );
  return players.filter((player) =>
    availability.on_field_ids.has(String(player.id)),
  );
}

export function derive_dismissed_player_ids(
  players: LineupPlayer[],
  events: GameEvent[],
  team_side: PlayingTeamSide,
  card_rules: CardSeverityRules,
): Set<string> {
  return derive_player_availability(players, events, team_side, card_rules)
    .ejected_ids;
}
