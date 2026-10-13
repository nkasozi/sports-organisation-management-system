import type { Fixture, GameEvent, GamePeriod } from "../entities/Fixture";
import type { ScoreAward } from "../entities/SportEventCatalogConstants";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import { type AsyncResult, create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_validation,
  is_blank_identifier,
} from "./FailureRelay";
import {
  fail_missing_fixture_id,
  find_fixture_for_event,
} from "./FixtureGameEventLookups";
import {
  create_end_fixture_plan,
  create_period_plan,
  create_recorded_event_plan,
  create_start_fixture_plan,
  is_event_already_recorded,
} from "./FixtureGameEventPlans";
import {
  type FixtureUpdatePlan,
  plan_from_updates,
  PREVIOUS_FIXTURE_STATUS,
  update_and_emit,
  update_tracking_previous,
} from "./FixtureGameEventUpdates";
import {
  decide_fixture_lifecycle_transition,
  FixtureLifecycleCommand,
  type FixtureLifecycleCommandValue,
  FixtureLifecycleOutcome,
} from "./FixtureLifecycleStateMachine";
import {
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
  FIXTURE_MESSAGE,
} from "./FixtureUseCaseConstants";
import { SHARED_FIXTURE_WRITE_EXECUTOR } from "./FixtureWriteExecutor";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureGameEventMethods = Pick<
  FixtureUseCasesPort,
  | "update_fixture_score"
  | "start_fixture"
  | "record_game_event"
  | "update_period"
  | "end_fixture"
>;

type FixtureId = ScalarValueInput<Fixture["id"]>;

type GuardedFixtureUpdate = {
  repository: FixtureRepository;
  id: FixtureId;
  command: FixtureLifecycleCommandValue;
  build_plan: (fixture: Fixture) => Option<FixtureUpdatePlan>;
};

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

async function run_guarded_fixture_update(
  update: GuardedFixtureUpdate,
): AsyncResult<Fixture> {
  const fixture_result = await find_fixture_for_event(
    update.repository,
    update.id,
  );
  if (!fixture_result.success) return fixture_result;
  const fixture = fixture_result.data;
  const decision = decide_fixture_lifecycle_transition(
    fixture.status,
    update.command,
  );
  if (decision.outcome === FixtureLifecycleOutcome.REJECTED)
    return fail_use_case({
      code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
      ...log_target(FIXTURE_EVENT.TRANSITION_REJECTED, {
        fixture_id: update.id,
        fixture_status: fixture.status,
        command: update.command,
      }),
      user_message: decision.reason,
    });
  const plan = update.build_plan(fixture);
  if (plan.status === OptionStatus.NONE) return create_success_result(fixture);
  return update_and_emit(update.repository, update.id, plan.value, {
    status: PREVIOUS_FIXTURE_STATUS.KNOWN,
    fixture,
  });
}

function build_record_event_plan(
  event: GameEvent,
  score_award: ScoreAward,
): (fixture: Fixture) => Option<FixtureUpdatePlan> {
  return (fixture) => {
    if (!is_event_already_recorded(fixture, event))
      return create_some_option(
        create_recorded_event_plan(fixture, event, score_award),
      );
    console.info(FIXTURE_LOG_SCOPE, {
      event: FIXTURE_EVENT.EVENT_ALREADY_RECORDED,
      fixture_id: fixture.id,
      game_event_id: event.id,
    });
    return create_none_option();
  };
}

function create_guarded_runner(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor,
): (
  id: FixtureId,
  command: FixtureLifecycleCommandValue,
  build_plan: GuardedFixtureUpdate["build_plan"],
) => AsyncResult<Fixture> {
  return async (id, command, build_plan) => {
    if (is_blank_identifier(id)) return fail_missing_fixture_id();
    return executor.run(String(id), () =>
      run_guarded_fixture_update({ repository, id, command, build_plan }),
    );
  };
}

async function update_fixture_score(
  repository: FixtureRepository,
  id: FixtureId,
  scores: { home_score: number; away_score: number },
): AsyncResult<Fixture> {
  if (is_blank_identifier(id)) return fail_missing_fixture_id();
  if (scores.home_score < 0 || scores.away_score < 0)
    return fail_validation(
      log_target(FIXTURE_EVENT.SCORE_INVALID, { fixture_id: id }),
      FIXTURE_MESSAGE.NEGATIVE_SCORE,
    );
  return update_tracking_previous(
    repository,
    id,
    plan_from_updates({
      home_team_score: scores.home_score,
      away_team_score: scores.away_score,
    }),
  );
}

export function create_fixture_game_events(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor = SHARED_FIXTURE_WRITE_EXECUTOR,
): FixtureGameEventMethods {
  const run_guarded = create_guarded_runner(repository, executor);
  return {
    update_fixture_score: (id, home_score, away_score) =>
      update_fixture_score(repository, id, { home_score, away_score }),
    start_fixture: (id, first_period: GamePeriod) =>
      run_guarded(id, FixtureLifecycleCommand.START, () =>
        create_some_option(create_start_fixture_plan(first_period)),
      ),
    record_game_event: (id, event, score_award) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.RECORD_EVENT,
        build_record_event_plan(event, score_award),
      ),
    update_period: (id, period, minute) =>
      run_guarded(id, FixtureLifecycleCommand.CHANGE_PERIOD, (fixture) =>
        create_some_option(create_period_plan(fixture, period, minute)),
      ),
    end_fixture: (id) =>
      run_guarded(id, FixtureLifecycleCommand.END, (fixture) =>
        create_some_option(create_end_fixture_plan(fixture)),
      ),
  };
}
