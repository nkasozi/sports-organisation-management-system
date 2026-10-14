import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type {
  OvertimeRule,
  Sport,
  SportGamePeriod,
} from "$lib/core/entities/Sport";
import { GAME_PERIOD, STAGE_TYPE } from "$lib/core/entities/StatusConstants";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

export const OVERTIME_OPTION = {
  NONE: "none",
  EXTRA_TIME: "extra_time",
  SHOOTOUT: "shootout",
} as const;

export type OvertimeOption =
  | { kind: typeof OVERTIME_OPTION.NONE }
  | { kind: typeof OVERTIME_OPTION.EXTRA_TIME; periods: SportGamePeriod[] }
  | { kind: typeof OVERTIME_OPTION.SHOOTOUT };

type OvertimeDecisionInput = {
  overtime_rules: Option<OvertimeRule>;
  stage_type: Option<string>;
  home_score: number;
  away_score: number;
  reached_period_ids: ReadonlySet<string>;
};

export const SHOOTOUT_PERIOD: SportGamePeriod = {
  id: GAME_PERIOD.PENALTY_SHOOTOUT,
  name: "Penalty Shootout" as SportGamePeriod["name"],
  duration_minutes: 0,
  is_break: false,
  order: Number.MAX_SAFE_INTEGER,
};

const TRIGGER = {
  DRAW: "draw",
  KNOCKOUT_DRAW: "knockout_draw",
  NEVER: "never",
} as const satisfies Record<string, OvertimeRule["trigger_condition"]>;

const SHOOTOUT_TYPES: ReadonlySet<string> = new Set(["penalties", "shootout"]);
const EXTRA_TIME_TYPES: ReadonlySet<string> = new Set([
  "extra_time",
  "golden_goal",
  "silver_goal",
]);
const NO_OVERTIME: OvertimeOption = { kind: OVERTIME_OPTION.NONE };

function is_triggered(
  input: OvertimeDecisionInput,
  rules: OvertimeRule,
): boolean {
  if (!rules.is_enabled || input.home_score !== input.away_score) return false;
  switch (rules.trigger_condition) {
    case TRIGGER.DRAW:
      return true;
    case TRIGGER.KNOCKOUT_DRAW:
      return (
        input.stage_type.status === OptionStatus.SOME &&
        input.stage_type.value === STAGE_TYPE.KNOCKOUT_STAGE
      );
    case TRIGGER.NEVER:
      return false;
  }
}

function offer_shootout_if_unplayed(
  input: OvertimeDecisionInput,
): OvertimeOption {
  return input.reached_period_ids.has(SHOOTOUT_PERIOD.id)
    ? NO_OVERTIME
    : { kind: OVERTIME_OPTION.SHOOTOUT };
}

function decide_after_extra_time(
  input: OvertimeDecisionInput,
  rules: OvertimeRule,
): OvertimeOption {
  const extra_time_started = rules.extra_time_periods.some((period) =>
    input.reached_period_ids.has(period.id),
  );
  if (!extra_time_started && rules.extra_time_periods.length > 0)
    return {
      kind: OVERTIME_OPTION.EXTRA_TIME,
      periods: rules.extra_time_periods,
    };
  return rules.penalties_config.initial_rounds > 0
    ? offer_shootout_if_unplayed(input)
    : NO_OVERTIME;
}

export function decide_overtime_option(
  input: OvertimeDecisionInput,
): OvertimeOption {
  if (input.overtime_rules.status === OptionStatus.NONE) return NO_OVERTIME;
  const rules = input.overtime_rules.value;
  if (!is_triggered(input, rules)) return NO_OVERTIME;
  if (SHOOTOUT_TYPES.has(rules.overtime_type))
    return offer_shootout_if_unplayed(input);
  return EXTRA_TIME_TYPES.has(rules.overtime_type)
    ? decide_after_extra_time(input, rules)
    : NO_OVERTIME;
}

export function resolve_overtime_rules(
  sport: Sport | undefined,
  competition: Competition | undefined,
): Option<OvertimeRule> {
  if (!sport?.overtime_rules) return create_none_option();
  return create_some_option({
    ...sport.overtime_rules,
    ...(competition?.rule_overrides?.overtime_rules ?? {}),
  } as OvertimeRule);
}

export function format_shootout_tally(
  fixture: Pick<Fixture, "shootout_home_score" | "shootout_away_score">,
): Option<string> {
  if (
    fixture.shootout_home_score === void 0 &&
    fixture.shootout_away_score === void 0
  )
    return create_none_option();
  return create_some_option(
    `(pens ${fixture.shootout_home_score ?? 0}-${fixture.shootout_away_score ?? 0})`,
  );
}
