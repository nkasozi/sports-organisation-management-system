import type {
  Fixture,
  GameEvent,
  UpdateFixtureInput,
} from "../entities/Fixture";
import { TEAM_SIDE } from "../entities/GameEventLogTypes";
import { read_event_points_awarded } from "../entities/GameEventStoredFacts";
import {
  create_credit_award,
  NO_SCORE_AWARD,
} from "../entities/SportEventCatalog";
import { GAME_PERIOD } from "../entities/StatusConstants";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import {
  calculate_score_delta,
  type FixtureUpdatePlan,
  plan_from_updates,
} from "./FixtureGameEventUpdates";

export type GameEventCorrection = Partial<
  Pick<
    GameEvent,
    | "player_id"
    | "player_name"
    | "secondary_player_id"
    | "secondary_player_name"
    | "minute"
    | "description"
  >
>;

const NO_SCORE = 0;

export function find_correctable_event(
  fixture: Fixture,
  event_id: string,
): Option<GameEvent> {
  const event = (fixture.game_events ?? []).find(
    (candidate) => String(candidate.id) === event_id,
  );
  return event && event.team_side !== TEAM_SIDE.MATCH
    ? create_some_option(event)
    : create_none_option();
}

function recorded_delta(event: GameEvent): { home: number; away: number } {
  const points = read_event_points_awarded(event);
  const award =
    points.status === OptionStatus.SOME && points.value > NO_SCORE
      ? create_credit_award(event.event_type, points.value)
      : NO_SCORE_AWARD;
  return calculate_score_delta(event, award);
}

function reversed_score_updates(
  fixture: Fixture,
  event: GameEvent,
): UpdateFixtureInput {
  const delta = recorded_delta(event);
  const reduce = (score: number | undefined, by: number): number =>
    Math.max(NO_SCORE, (score ?? NO_SCORE) - by);
  return event.period_id === GAME_PERIOD.PENALTY_SHOOTOUT
    ? {
        shootout_home_score: reduce(fixture.shootout_home_score, delta.home),
        shootout_away_score: reduce(fixture.shootout_away_score, delta.away),
      }
    : {
        home_team_score: reduce(fixture.home_team_score, delta.home),
        away_team_score: reduce(fixture.away_team_score, delta.away),
      };
}

export function create_removed_event_plan(
  fixture: Fixture,
  event_id: string,
): FixtureUpdatePlan {
  const events = fixture.game_events ?? [];
  const removed = events.find((event) => String(event.id) === event_id);
  if (!removed) return plan_from_updates({});
  return plan_from_updates({
    game_events: events.filter((event) => String(event.id) !== event_id),
    ...reversed_score_updates(fixture, removed),
  });
}

export function create_edited_event_plan(
  fixture: Fixture,
  event_id: string,
  correction: GameEventCorrection,
): FixtureUpdatePlan {
  return plan_from_updates({
    game_events: (fixture.game_events ?? []).map((event) =>
      String(event.id) === event_id ? { ...event, ...correction } : event,
    ),
  });
}
