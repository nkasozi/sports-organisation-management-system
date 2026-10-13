import type { EntityId } from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import type { GameEvent, GamePeriod } from "./FixtureTypes";
import {
  create_credit_award,
  NO_SCORE_AWARD,
  SCORE_AWARD_KIND,
  type ScoreAward,
  type ScoreAwardResolver,
} from "./SportEventCatalog";

const NUMBER_TYPE_NAME = "number";
const STRING_TYPE_NAME = "string";
const NO_POINTS = 0;

function read_number_fact(value: unknown): Option<number> {
  return typeof value === NUMBER_TYPE_NAME && Number.isFinite(value)
    ? create_some_option(value as number)
    : create_none_option();
}

function read_text_fact<TValue extends string>(value: unknown): Option<TValue> {
  return typeof value === STRING_TYPE_NAME && (value as string).length > 0
    ? create_some_option(value as TValue)
    : create_none_option();
}

export function read_event_points_awarded(event: GameEvent): Option<number> {
  return read_number_fact(event.points_awarded);
}

export function read_event_period_id(event: GameEvent): Option<GamePeriod> {
  return read_text_fact<GamePeriod>(event.period_id);
}

export function read_event_player_id(event: GameEvent): Option<EntityId> {
  return read_text_fact<EntityId>(event.player_id);
}

export function read_event_secondary_player_id(
  event: GameEvent,
): Option<EntityId> {
  return read_text_fact<EntityId>(event.secondary_player_id);
}

export function read_score_award_points(award: ScoreAward): number {
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return NO_POINTS;
    case SCORE_AWARD_KIND.CREDIT:
      return award.points;
  }
}

function award_from_stored_points(
  event: GameEvent,
  points: number,
): ScoreAward {
  return points > NO_POINTS
    ? create_credit_award(event.event_type, points)
    : NO_SCORE_AWARD;
}

export function resolve_event_score_award(
  event: GameEvent,
  resolve_score: ScoreAwardResolver,
): ScoreAward {
  const stored_points = read_event_points_awarded(event);
  switch (stored_points.status) {
    case OptionStatus.SOME:
      return award_from_stored_points(event, stored_points.value);
    case OptionStatus.NONE:
      return resolve_score(event.event_type);
  }
}
