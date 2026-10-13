import type { Fixture, GameEvent } from "../entities/Fixture";
import { FIXTURE_STATUS, GAME_PERIOD } from "../entities/StatusConstants";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
} from "./FailureRelay";
import {
  calculate_score_delta,
  type FixtureUpdatePlan,
  plan_from_updates,
  PREVIOUS_FIXTURE_STATUS,
  update_and_emit,
  update_tracking_previous,
} from "./FixtureGameEventUpdates";
import {
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
  FIXTURE_MESSAGE,
} from "./FixtureUseCaseConstants";

type FixtureGameEventMethods = Pick<
  FixtureUseCasesPort,
  | "update_fixture_score"
  | "start_fixture"
  | "record_game_event"
  | "update_period"
  | "end_fixture"
>;

type FixtureId = ScalarValueInput<Fixture["id"]>;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

function fail_missing_fixture_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_EVENT.ID_MISSING),
    FIXTURE_MESSAGE.ID_REQUIRED,
  );
}

async function find_fixture_for_event(
  repository: FixtureRepository,
  id: FixtureId,
): AsyncResult<Fixture> {
  if (is_blank_identifier(id)) return fail_missing_fixture_id();
  const fixture_result = await repository.find_by_id(id);
  if (fixture_result.success) return fixture_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(FIXTURE_EVENT.NOT_FOUND, { fixture_id: id }),
    user_message: FIXTURE_MESSAGE.NOT_FOUND,
    technical_detail: fixture_result.error,
  });
}

function create_start_fixture_plan(): FixtureUpdatePlan {
  return plan_from_updates({
    status: FIXTURE_STATUS.IN_PROGRESS,
    current_period: GAME_PERIOD.FIRST_HALF,
    current_minute: 0,
    home_team_score: 0,
    away_team_score: 0,
    game_events: [],
  });
}

function create_recorded_event_plan(
  fixture: Fixture,
  event: GameEvent,
): FixtureUpdatePlan {
  const delta = calculate_score_delta(event);
  return plan_from_updates({
    game_events: [...(fixture.game_events || []), event],
    home_team_score: (fixture.home_team_score || 0) + delta.home,
    away_team_score: (fixture.away_team_score || 0) + delta.away,
    current_minute: event.minute,
  });
}

function create_end_fixture_plan(fixture: Fixture): FixtureUpdatePlan {
  return plan_from_updates({
    status: FIXTURE_STATUS.COMPLETED,
    current_period: GAME_PERIOD.FINISHED,
    home_team_score: fixture.home_team_score ?? 0,
    away_team_score: fixture.away_team_score ?? 0,
  });
}

async function record_game_event(
  repository: FixtureRepository,
  id: FixtureId,
  event: GameEvent,
): AsyncResult<Fixture> {
  const fixture_result = await find_fixture_for_event(repository, id);
  if (!fixture_result.success) return fixture_result;
  return update_and_emit(
    repository,
    id,
    create_recorded_event_plan(fixture_result.data, event),
    { status: PREVIOUS_FIXTURE_STATUS.KNOWN, fixture: fixture_result.data },
  );
}

async function end_fixture(
  repository: FixtureRepository,
  id: FixtureId,
): AsyncResult<Fixture> {
  const fixture_result = await find_fixture_for_event(repository, id);
  if (!fixture_result.success) return fixture_result;
  return update_and_emit(
    repository,
    id,
    create_end_fixture_plan(fixture_result.data),
    { status: PREVIOUS_FIXTURE_STATUS.KNOWN, fixture: fixture_result.data },
  );
}

export function create_fixture_game_events(
  repository: FixtureRepository,
): FixtureGameEventMethods {
  return {
    async update_fixture_score(id, home_score, away_score) {
      if (is_blank_identifier(id)) return fail_missing_fixture_id();
      if (home_score < 0 || away_score < 0)
        return fail_validation(
          log_target(FIXTURE_EVENT.SCORE_INVALID, { fixture_id: id }),
          FIXTURE_MESSAGE.NEGATIVE_SCORE,
        );
      return update_tracking_previous(
        repository,
        id,
        plan_from_updates({
          home_team_score: home_score,
          away_team_score: away_score,
        }),
      );
    },
    async start_fixture(id) {
      if (is_blank_identifier(id)) return fail_missing_fixture_id();
      return update_tracking_previous(
        repository,
        id,
        create_start_fixture_plan(),
      );
    },
    record_game_event: (id, event) => record_game_event(repository, id, event),
    async update_period(id, period, minute) {
      if (is_blank_identifier(id)) return fail_missing_fixture_id();
      return update_tracking_previous(
        repository,
        id,
        plan_from_updates({ current_period: period, current_minute: minute }),
      );
    },
    end_fixture: (id) => end_fixture(repository, id),
  };
}
