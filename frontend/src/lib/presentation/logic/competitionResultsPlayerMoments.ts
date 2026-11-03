import type { Fixture } from "$lib/core/entities/Fixture";
import { build_fixture_kickoff_date_time } from "$lib/core/entities/FixtureKickoff";
import { TEAM_SIDE } from "$lib/presentation/logic/gameEventConstants";

export const PLAYER_STAT_MOMENT_KIND = {
  SCORE: "score",
  ASSIST: "assist",
  CARD: "card",
} as const;

export type PlayerStatMomentKind =
  (typeof PLAYER_STAT_MOMENT_KIND)[keyof typeof PLAYER_STAT_MOMENT_KIND];

export interface PlayerStatMomentContext {
  fixture_id: string;
  kickoff: string;
  opponent_team_id: string;
  timing_label: string;
  timing_rank: number;
}

export interface PeriodInfo {
  name: string;
  order: number;
}

export type PlayerStatMoment =
  | (PlayerStatMomentContext & {
      kind: typeof PLAYER_STAT_MOMENT_KIND.SCORE;
      points: number;
    })
  | (PlayerStatMomentContext & {
      kind: typeof PLAYER_STAT_MOMENT_KIND.ASSIST;
    })
  | (PlayerStatMomentContext & {
      kind: typeof PLAYER_STAT_MOMENT_KIND.CARD;
      card_type_id: string;
    });

interface MomentTiming {
  minute: number;
  stoppage_time_minute: number;
  period_id?: string;
}

const MINUTE_MARK = "'";
const STOPPAGE_SEPARATOR = "+";

const PERIOD_RANK_STEP = 1_000_000;
const STOPPAGE_STEPS_PER_MINUTE = 100;

export function build_moment_timing_rank(
  timing: MomentTiming,
  periods: ReadonlyMap<string, PeriodInfo>,
): number {
  const period_order = periods.get(timing.period_id ?? "")?.order ?? 0;
  return (
    period_order * PERIOD_RANK_STEP +
    timing.minute * STOPPAGE_STEPS_PER_MINUTE +
    timing.stoppage_time_minute
  );
}

export function build_moment_timing_label(
  timing: MomentTiming,
  periods: ReadonlyMap<string, PeriodInfo>,
): string {
  if (timing.minute > 0)
    return timing.stoppage_time_minute > 0
      ? `${timing.minute}${STOPPAGE_SEPARATOR}${timing.stoppage_time_minute}${MINUTE_MARK}`
      : `${timing.minute}${MINUTE_MARK}`;
  return periods.get(timing.period_id ?? "")?.name ?? "";
}

export function find_acting_team_id(
  fixture: Fixture,
  team_side: string,
): string {
  return team_side === TEAM_SIDE.HOME
    ? fixture.home_team_id
    : fixture.away_team_id;
}

export function build_moment_context(
  fixture: Fixture,
  game_event: MomentTiming & { team_side: string },
  periods: ReadonlyMap<string, PeriodInfo>,
): PlayerStatMomentContext {
  return {
    fixture_id: fixture.id,
    kickoff: build_fixture_kickoff_date_time(fixture),
    opponent_team_id:
      game_event.team_side === TEAM_SIDE.HOME
        ? fixture.away_team_id
        : fixture.home_team_id,
    timing_label: build_moment_timing_label(game_event, periods),
    timing_rank: build_moment_timing_rank(game_event, periods),
  };
}
