import type { Fixture, GameEvent, GamePeriod } from "../entities/Fixture";
import type { ScoreAward } from "../entities/SportEventCatalogConstants";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import { OptionStatus } from "../types/Option";
import {
  create_edited_event_plan,
  create_removed_event_plan,
  find_correctable_event,
} from "./FixtureGameEventCorrections";
import {
  create_end_fixture_plan,
  create_recorded_event_plan,
  create_start_fixture_plan,
  is_event_already_recorded,
} from "./FixtureGameEventPlans";
import type { FixtureUpdatePlan } from "./FixtureGameEventUpdates";
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
  | "update_period"
  | "end_fixture"
>;

const EVENT_NOT_FOUND_REASON =
  "This event is no longer in the game. Refresh the page to see the latest events.";

function build_correction_plan(
  event_id: string,
  build: (fixture: Fixture) => FixtureUpdatePlan,
): FixturePlanBuilder {
  return (fixture) =>
    find_correctable_event(fixture, event_id).status === OptionStatus.SOME
      ? { kind: FIXTURE_PLAN_DECISION.APPLY, plan: build(fixture) }
      : { kind: FIXTURE_PLAN_DECISION.REJECT, reason: EVENT_NOT_FOUND_REASON };
}

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
): Pick<FixtureGameEventMethods, "update_game_event" | "remove_game_event"> {
  return {
    update_game_event: (id, event_id, correction) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.RECORD_EVENT,
        build_correction_plan(event_id, (fixture) =>
          create_edited_event_plan(fixture, event_id, correction),
        ),
      ),
    remove_game_event: (id, event_id) =>
      run_guarded(
        id,
        FixtureLifecycleCommand.RECORD_EVENT,
        build_correction_plan(event_id, (fixture) =>
          create_removed_event_plan(fixture, event_id),
        ),
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
