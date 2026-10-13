import type { Fixture, GameEvent, GamePeriod } from "../entities/Fixture";
import { read_score_award_points } from "../entities/GameEventStoredFacts";
import type { ScoreAward } from "../entities/SportEventCatalogConstants";
import { FIXTURE_STATUS, GAME_PERIOD } from "../entities/StatusConstants";
import {
  calculate_score_delta,
  type FixtureUpdatePlan,
  plan_from_updates,
} from "./FixtureGameEventUpdates";

export function create_start_fixture_plan(
  first_period: GamePeriod,
): FixtureUpdatePlan {
  return plan_from_updates({
    status: FIXTURE_STATUS.IN_PROGRESS,
    current_period: first_period,
    current_minute: 0,
    home_team_score: 0,
    away_team_score: 0,
    game_events: [],
  });
}

function resolve_forward_minute(fixture: Fixture, minute: number): number {
  return Math.max(fixture.current_minute || 0, minute);
}

export function is_event_already_recorded(
  fixture: Fixture,
  event: GameEvent,
): boolean {
  return (fixture.game_events || []).some(
    (recorded_event) => recorded_event.id === event.id,
  );
}

function stamp_recorded_event_facts(
  fixture: Fixture,
  event: GameEvent,
  score_award: ScoreAward,
): GameEvent {
  const period_fields = fixture.current_period
    ? { period_id: fixture.current_period }
    : {};
  return {
    ...event,
    ...period_fields,
    points_awarded: read_score_award_points(score_award),
  };
}

export function create_recorded_event_plan(
  fixture: Fixture,
  event: GameEvent,
  score_award: ScoreAward,
): FixtureUpdatePlan {
  const delta = calculate_score_delta(event, score_award);
  return plan_from_updates({
    game_events: [
      ...(fixture.game_events || []),
      stamp_recorded_event_facts(fixture, event, score_award),
    ],
    home_team_score: (fixture.home_team_score || 0) + delta.home,
    away_team_score: (fixture.away_team_score || 0) + delta.away,
    current_minute: resolve_forward_minute(fixture, event.minute),
  });
}

export function create_period_plan(
  fixture: Fixture,
  period: GamePeriod,
  minute: number,
): FixtureUpdatePlan {
  return plan_from_updates({
    current_period: period,
    current_minute: resolve_forward_minute(fixture, minute),
  });
}

export function create_end_fixture_plan(fixture: Fixture): FixtureUpdatePlan {
  return plan_from_updates({
    status: FIXTURE_STATUS.COMPLETED,
    current_period: GAME_PERIOD.FINISHED,
    home_team_score: fixture.home_team_score ?? 0,
    away_team_score: fixture.away_team_score ?? 0,
  });
}
