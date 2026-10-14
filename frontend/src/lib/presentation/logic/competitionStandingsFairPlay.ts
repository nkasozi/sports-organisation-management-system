import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { CardType } from "$lib/core/entities/Sport";
import { create_default_card_types } from "$lib/core/entities/SportDefaults";

import { TEAM_SIDE } from "./gameEventConstants";

type FairPlayCardSource = Pick<CardType, "id" | "severity">;

export type FairPlayCardWeights = ReadonlyMap<string, number>;

const FAIR_PLAY_SEVERITY_WEIGHT: Readonly<
  Record<CardType["severity"], number>
> = {
  warning: 1,
  suspension: 2,
  ejection: 3,
};

const NO_FAIR_PLAY_POINTS = 0;
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const UNSIGNED_SHIFT = 0;
const LOT_SEED_SEPARATOR = "|";

export function build_fair_play_card_weights(
  card_types: readonly FairPlayCardSource[],
): FairPlayCardWeights {
  return new Map(
    card_types.map((card) => [
      card.id,
      FAIR_PLAY_SEVERITY_WEIGHT[card.severity],
    ]),
  );
}

export const DEFAULT_FAIR_PLAY_CARD_WEIGHTS: FairPlayCardWeights =
  build_fair_play_card_weights(create_default_card_types());

function find_team_side(
  fixture: Fixture,
  team_id: string,
): GameEvent["team_side"] {
  if (fixture.home_team_id === team_id) return TEAM_SIDE.HOME;
  return fixture.away_team_id === team_id ? TEAM_SIDE.AWAY : TEAM_SIDE.MATCH;
}

function sum_fixture_card_points(
  fixture: Fixture,
  team_id: string,
  weights: FairPlayCardWeights,
): number {
  const team_side = find_team_side(fixture, team_id);
  if (team_side === TEAM_SIDE.MATCH) return NO_FAIR_PLAY_POINTS;
  return (fixture.game_events ?? [])
    .filter((event) => event.team_side === team_side)
    .reduce(
      (total, event) =>
        total + (weights.get(event.event_type) ?? NO_FAIR_PLAY_POINTS),
      NO_FAIR_PLAY_POINTS,
    );
}

export function count_team_fair_play_points(
  team_id: string,
  completed_fixtures: readonly Fixture[],
  weights: FairPlayCardWeights,
): number {
  return completed_fixtures.reduce(
    (total, fixture) =>
      total + sum_fixture_card_points(fixture, team_id, weights),
    NO_FAIR_PLAY_POINTS,
  );
}

function hash_lot_seed(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (const character of seed) {
    hash = Math.imul(hash ^ character.charCodeAt(0), FNV_PRIME);
  }
  return hash >>> UNSIGNED_SHIFT;
}

export function build_drawing_of_lots_seed(
  completed_fixtures: readonly Fixture[],
): string {
  return [
    ...new Set(completed_fixtures.map((fixture) => fixture.competition_id)),
  ]
    .sort()
    .join(LOT_SEED_SEPARATOR);
}

export function draw_team_lot(seed: string, team_id: string): number {
  return hash_lot_seed(`${seed}${LOT_SEED_SEPARATOR}${team_id}`);
}
