import type { Fixture, GameEvent, GamePeriod } from "../entities/Fixture";
import { GAME_EVENT_LOG_TYPE } from "../entities/GameEventLogTypes";
import { GAME_PERIOD } from "../entities/StatusConstants";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import {
  type FixtureUpdatePlan,
  plan_from_updates,
} from "./FixtureGameEventUpdates";

export type PeriodTransitionCommand = {
  expected_current_period: GamePeriod;
  next_period: GamePeriod;
  minute: number;
  period_sequence: GamePeriod[];
  period_event: GameEvent;
};

export const FIXTURE_PLAN_DECISION = {
  APPLY: "apply",
  SKIP: "skip",
  REJECT: "reject",
} as const;

export type FixturePlanDecision =
  | { kind: typeof FIXTURE_PLAN_DECISION.APPLY; plan: FixtureUpdatePlan }
  | { kind: typeof FIXTURE_PLAN_DECISION.SKIP }
  | { kind: typeof FIXTURE_PLAN_DECISION.REJECT; reason: string };

const PERIOD_TRANSITION_MESSAGE = {
  STALE_PERIOD:
    "This game has already moved to a different period, possibly from another device. Refresh the page to see the latest state.",
  NOT_FORWARD:
    "Periods can only move forward. This period has already been played.",
  UNKNOWN_PERIOD: "This period is not part of the sport's rules for this game.",
  ALREADY_FINISHED: "This game has already reached full time.",
} as const;

const NOT_IN_SEQUENCE = -1;

function reject(reason: string): FixturePlanDecision {
  return { kind: FIXTURE_PLAN_DECISION.REJECT, reason };
}

function find_furthest_reached_index(
  fixture: Fixture,
  period_sequence: GamePeriod[],
): number {
  const reached_periods = [
    fixture.current_period,
    ...(fixture.game_events ?? []).map((event) => event.period_id),
  ];
  return reached_periods.reduce<number>(
    (furthest, period) =>
      Math.max(furthest, period_sequence.indexOf(period as GamePeriod)),
    NOT_IN_SEQUENCE,
  );
}

function find_forward_rejection(
  fixture: Fixture,
  command: PeriodTransitionCommand,
): Option<string> {
  if (command.next_period === GAME_PERIOD.FINISHED)
    return fixture.current_period === GAME_PERIOD.FINISHED
      ? create_some_option(PERIOD_TRANSITION_MESSAGE.ALREADY_FINISHED)
      : create_none_option();
  const next_index = command.period_sequence.indexOf(command.next_period);
  if (next_index === NOT_IN_SEQUENCE)
    return create_some_option(PERIOD_TRANSITION_MESSAGE.UNKNOWN_PERIOD);
  return next_index >
    find_furthest_reached_index(fixture, command.period_sequence)
    ? create_none_option()
    : create_some_option(PERIOD_TRANSITION_MESSAGE.NOT_FORWARD);
}

function resolve_event_period(command: PeriodTransitionCommand): GamePeriod {
  return command.period_event.event_type === GAME_EVENT_LOG_TYPE.PERIOD_START
    ? command.next_period
    : command.expected_current_period;
}

function build_period_plan(
  fixture: Fixture,
  command: PeriodTransitionCommand,
): FixtureUpdatePlan {
  return plan_from_updates({
    current_period: command.next_period,
    current_minute: Math.max(fixture.current_minute || 0, command.minute),
    game_events: [
      ...(fixture.game_events ?? []),
      { ...command.period_event, period_id: resolve_event_period(command) },
    ],
  });
}

export function decide_period_transition(
  fixture: Fixture,
  command: PeriodTransitionCommand,
): FixturePlanDecision {
  const already_recorded = (fixture.game_events ?? []).some(
    (event) => event.id === command.period_event.id,
  );
  if (already_recorded) return { kind: FIXTURE_PLAN_DECISION.SKIP };
  if (fixture.current_period !== command.expected_current_period)
    return reject(PERIOD_TRANSITION_MESSAGE.STALE_PERIOD);
  const forward_rejection = find_forward_rejection(fixture, command);
  if (forward_rejection.status === OptionStatus.SOME)
    return reject(forward_rejection.value);
  return {
    kind: FIXTURE_PLAN_DECISION.APPLY,
    plan: build_period_plan(fixture, command),
  };
}
