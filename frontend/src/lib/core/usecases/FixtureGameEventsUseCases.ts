import type { GameEvent, GamePeriod } from "../entities/Fixture";
import type { ScoreAward } from "../entities/SportEventCatalogConstants";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import {
  build_edit_allowance_reset_plan,
  build_event_edit_plan,
  build_event_removal_plan,
} from "./FixtureGameEventCorrectionPlans";
import {
  create_end_fixture_plan,
  create_recorded_event_plan,
  create_start_fixture_plan,
  is_event_already_recorded,
} from "./FixtureGameEventPlans";
import {
  create_guarded_runner,
  type FixturePlanBuilder,
} from "./FixtureGuardedRunner";
import { FixtureLifecycleCommand } from "./FixtureLifecycleStateMachine";
import {
  decide_period_transition,
  FIXTURE_PLAN_DECISION,
} from "./FixturePeriodTransition";
import { FIXTURE_EVENT, FIXTURE_LOG_SCOPE } from "./FixtureUseCaseConstants";
import { SHARED_FIXTURE_WRITE_EXECUTOR } from "./FixtureWriteExecutor";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureGameEventMethods = Pick<
  FixtureUseCasesPort,
  | "start_fixture"
  | "record_game_event"
  | "update_game_event"
  | "remove_game_event"
  | "reset_event_edits"
  | "update_period"
  | "end_fixture"
>;

function build_record_event_plan(
  event: GameEvent,
  score_award: ScoreAward,
): FixturePlanBuilder {
  return (fixture) => {
    if (!is_event_already_recorded(fixture, event))
      return {
        kind: FIXTURE_PLAN_DECISION.APPLY,
        plan: create_recorded_event_plan(fixture, event, score_award),
      };
    console.info(FIXTURE_LOG_SCOPE, {
      event: FIXTURE_EVENT.EVENT_ALREADY_RECORDED,
      fixture_id: fixture.id,
      game_event_id: event.id,
    });
    return { kind: FIXTURE_PLAN_DECISION.SKIP };
  };
}

function create_event_correction_methods(
  run_guarded: ReturnType<typeof create_guarded_runner>,
): Pick<
  FixtureGameEventMethods,
  "update_game_event" | "remove_game_event" | "reset_event_edits"
> {
  return {
    update_game_event: (id, event_id, correction, request) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.CORRECT_EVENT,
        build_event_edit_plan(event_id, correction, request),
      ),
    remove_game_event: (id, event_id, request) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.CORRECT_EVENT,
        build_event_removal_plan(event_id, request),
      ),
    reset_event_edits: (id, author) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.CORRECT_EVENT,
        build_edit_allowance_reset_plan(author),
      ),
  };
}

export function create_fixture_game_events(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor = SHARED_FIXTURE_WRITE_EXECUTOR,
): FixtureGameEventMethods {
  const run_guarded = create_guarded_runner(repository, executor);
  return {
    start_fixture: (id, first_period: GamePeriod) =>
      run_guarded(id, FixtureLifecycleCommand.START, () => ({
        kind: FIXTURE_PLAN_DECISION.APPLY,
        plan: create_start_fixture_plan(first_period),
      })),
    record_game_event: (id, event, score_award) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.RECORD_EVENT,
        build_record_event_plan(event, score_award),
      ),
    ...create_event_correction_methods(run_guarded),
    update_period: (id, command) =>
      run_guarded(id, FixtureLifecycleCommand.CHANGE_PERIOD, (fixture) =>
        decide_period_transition(fixture, command),
      ),
    end_fixture: (id) =>
      run_guarded(id, FixtureLifecycleCommand.END, (fixture) => ({
        kind: FIXTURE_PLAN_DECISION.APPLY,
        plan: create_end_fixture_plan(fixture),
      })),
  };
}
