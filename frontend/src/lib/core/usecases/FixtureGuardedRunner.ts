import type { Fixture } from "../entities/Fixture";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import { type AsyncResult, create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { create_log_target_builder, is_blank_identifier } from "./FailureRelay";
import {
  fail_missing_fixture_id,
  find_fixture_for_event,
} from "./FixtureGameEventLookups";
import {
  PREVIOUS_FIXTURE_STATUS,
  update_and_emit,
} from "./FixtureGameEventUpdates";
import {
  decide_fixture_lifecycle_transition,
  type FixtureLifecycleCommandValue,
  FixtureLifecycleOutcome,
} from "./FixtureLifecycleStateMachine";
import {
  FIXTURE_PLAN_DECISION,
  type FixturePlanDecision,
} from "./FixturePeriodTransition";
import { FIXTURE_EVENT, FIXTURE_LOG_SCOPE } from "./FixtureUseCaseConstants";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureId = ScalarValueInput<Fixture["id"]>;

export type FixturePlanBuilder = (fixture: Fixture) => FixturePlanDecision;

type GuardedFixtureUpdate = {
  repository: FixtureRepository;
  id: FixtureId;
  command: FixtureLifecycleCommandValue;
  build_plan: FixturePlanBuilder;
};

type GuardedFixtureRunner = (
  id: FixtureId,
  command: FixtureLifecycleCommandValue,
  build_plan: FixturePlanBuilder,
) => AsyncResult<Fixture>;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

function fail_rejected_change(
  update: GuardedFixtureUpdate,
  fixture: Fixture,
  event: string,
  reason: string,
): AsyncResult<Fixture> {
  return Promise.resolve(
    fail_use_case({
      code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
      ...log_target(event, {
        fixture_id: update.id,
        fixture_status: fixture.status,
        current_period: fixture.current_period,
        command: update.command,
      }),
      user_message: reason,
    }),
  );
}

function apply_plan_decision(
  update: GuardedFixtureUpdate,
  fixture: Fixture,
): AsyncResult<Fixture> {
  const decision = update.build_plan(fixture);
  switch (decision.kind) {
    case FIXTURE_PLAN_DECISION.SKIP:
      return Promise.resolve(create_success_result(fixture));
    case FIXTURE_PLAN_DECISION.REJECT:
      return fail_rejected_change(
        update,
        fixture,
        FIXTURE_EVENT.PERIOD_CHANGE_REJECTED,
        decision.reason,
      );
    case FIXTURE_PLAN_DECISION.APPLY:
      return update_and_emit(update.repository, update.id, decision.plan, {
        status: PREVIOUS_FIXTURE_STATUS.KNOWN,
        fixture,
      });
  }
}

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
    return fail_rejected_change(
      update,
      fixture,
      FIXTURE_EVENT.TRANSITION_REJECTED,
      decision.reason,
    );
  return apply_plan_decision(update, fixture);
}

export function create_guarded_runner(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor,
): GuardedFixtureRunner {
  return async (id, command, build_plan) => {
    if (is_blank_identifier(id)) return fail_missing_fixture_id();
    return executor.run(String(id), () =>
      run_guarded_fixture_update({ repository, id, command, build_plan }),
    );
  };
}
