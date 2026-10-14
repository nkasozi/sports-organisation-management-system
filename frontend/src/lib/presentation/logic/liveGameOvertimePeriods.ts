import type { Fixture } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import { get_effective_periods_for } from "./liveGameDetailPeriodState";
import type { PeriodButtonConfig } from "./liveGameDetailState";
import {
  derive_optional_fixture_match_phase,
  LIVE_MATCH_PHASE,
} from "./liveGameMatchPhase";
import {
  decide_overtime_option,
  OVERTIME_OPTION,
  type OvertimeOption,
  resolve_overtime_rules,
  SHOOTOUT_PERIOD,
} from "./liveGameOvertimePlan";

type OvertimeSource = {
  fixture?: Fixture;
  sport?: Parameters<typeof resolve_overtime_rules>[0];
  competition?: Parameters<typeof resolve_overtime_rules>[1];
  stage?: { stage_type: string };
};

type LiveOvertimePeriods = {
  effective_periods: SportGamePeriod[];
  overtime_button: Option<PeriodButtonConfig>;
};

const OVERTIME_BUTTON_TEXT = {
  EXTRA_TIME_LABEL: "Start Extra Time",
  EXTRA_TIME_MESSAGE:
    "The game is level. Start extra time as the sport's rules require?",
  SHOOTOUT_LABEL: "Start Penalty Shootout",
  SHOOTOUT_MESSAGE:
    "The game is still level. Start the penalty shootout to decide the winner?",
  ICON: "▶️",
} as const;

function collect_reached_period_ids(fixture: Fixture | undefined): Set<string> {
  if (!fixture) return new Set();
  return new Set(
    [
      fixture.current_period,
      ...(fixture.game_events ?? []).map((event) => event.period_id),
    ].filter((period_id): period_id is string => Boolean(period_id)),
  );
}

function decide_option(
  source: OvertimeSource,
  reached_ids: Set<string>,
): OvertimeOption {
  if (
    derive_optional_fixture_match_phase(source.fixture) !==
    LIVE_MATCH_PHASE.AWAITING_FULL_TIME
  )
    return { kind: OVERTIME_OPTION.NONE };
  return decide_overtime_option({
    overtime_rules: resolve_overtime_rules(source.sport, source.competition),
    stage_type: source.stage
      ? create_some_option(source.stage.stage_type)
      : create_none_option(),
    home_score: source.fixture?.home_team_score ?? 0,
    away_score: source.fixture?.away_team_score ?? 0,
    reached_period_ids: reached_ids,
  });
}

function build_overtime_button(
  option: OvertimeOption,
): Option<PeriodButtonConfig> {
  switch (option.kind) {
    case OVERTIME_OPTION.NONE:
      return create_none_option();
    case OVERTIME_OPTION.EXTRA_TIME:
      return create_some_option({
        label: OVERTIME_BUTTON_TEXT.EXTRA_TIME_LABEL,
        icon: OVERTIME_BUTTON_TEXT.ICON,
        is_end_action: false,
        next_period: option.periods[0].id,
        message: OVERTIME_BUTTON_TEXT.EXTRA_TIME_MESSAGE,
        confirm_text: OVERTIME_BUTTON_TEXT.EXTRA_TIME_LABEL,
      });
    case OVERTIME_OPTION.SHOOTOUT:
      return create_some_option({
        label: OVERTIME_BUTTON_TEXT.SHOOTOUT_LABEL,
        icon: OVERTIME_BUTTON_TEXT.ICON,
        is_end_action: false,
        next_period: SHOOTOUT_PERIOD.id,
        message: OVERTIME_BUTTON_TEXT.SHOOTOUT_MESSAGE,
        confirm_text: OVERTIME_BUTTON_TEXT.SHOOTOUT_LABEL,
      });
  }
}

export function derive_live_overtime_periods(
  source: OvertimeSource,
): LiveOvertimePeriods {
  const regulation = get_effective_periods_for(
    source.sport,
    source.competition,
  );
  const rules = resolve_overtime_rules(source.sport, source.competition);
  const extra_time_periods =
    rules.status === OptionStatus.SOME ? rules.value.extra_time_periods : [];
  const reached_ids = collect_reached_period_ids(source.fixture);
  const option = decide_option(source, reached_ids);
  const include_extra_time =
    option.kind === OVERTIME_OPTION.EXTRA_TIME ||
    extra_time_periods.some((period) => reached_ids.has(period.id));
  const include_shootout =
    option.kind === OVERTIME_OPTION.SHOOTOUT ||
    reached_ids.has(SHOOTOUT_PERIOD.id);
  return {
    effective_periods: [
      ...regulation,
      ...(include_extra_time ? extra_time_periods : []),
      ...(include_shootout ? [SHOOTOUT_PERIOD] : []),
    ],
    overtime_button: build_overtime_button(option),
  };
}
