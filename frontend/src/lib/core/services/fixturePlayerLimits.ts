import type { CompetitionRuleOverrides } from "../entities/CompetitionTypes";
import type { Sport } from "../entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";

export interface FixturePlayerLimits {
  min_players: number;
  max_players: number;
  starters_count: number;
}

export type SportPlayerLimitSource = Pick<
  Sport,
  "min_players_per_fixture" | "max_players_per_fixture" | "max_players_on_field"
>;

export const DEFAULT_FIXTURE_PLAYER_LIMITS: FixturePlayerLimits = {
  min_players: 2,
  max_players: 18,
  starters_count: 11,
};

const NUMBER_TYPE_NAME = "number";

function read_numeric_override(value: unknown): Option<number> {
  return typeof value === NUMBER_TYPE_NAME
    ? create_some_option(Number(value))
    : create_none_option();
}

function override_or(value: unknown, fallback: number): number {
  const override = read_numeric_override(value);
  return override.status === OptionStatus.SOME ? override.value : fallback;
}

function cap_starters_to_squad(
  limits: FixturePlayerLimits,
): FixturePlayerLimits {
  return {
    ...limits,
    starters_count: Math.min(limits.starters_count, limits.max_players),
  };
}

export function build_sport_fixture_player_limits(
  sport: SportPlayerLimitSource,
): FixturePlayerLimits {
  return cap_starters_to_squad({
    min_players:
      sport.min_players_per_fixture ||
      DEFAULT_FIXTURE_PLAYER_LIMITS.min_players,
    max_players:
      sport.max_players_per_fixture ||
      DEFAULT_FIXTURE_PLAYER_LIMITS.max_players,
    starters_count:
      sport.max_players_on_field ||
      DEFAULT_FIXTURE_PLAYER_LIMITS.starters_count,
  });
}

export function apply_competition_fixture_player_limit_overrides(
  limits: FixturePlayerLimits,
  rule_overrides: CompetitionRuleOverrides,
): FixturePlayerLimits {
  return cap_starters_to_squad({
    min_players: override_or(
      rule_overrides.min_players_on_field,
      limits.min_players,
    ),
    max_players: override_or(rule_overrides.max_squad_size, limits.max_players),
    starters_count: override_or(
      rule_overrides.max_players_on_field,
      limits.starters_count,
    ),
  });
}

export function has_complete_player_limit_overrides(
  rule_overrides: CompetitionRuleOverrides,
): boolean {
  return [
    rule_overrides.min_players_on_field,
    rule_overrides.max_squad_size,
    rule_overrides.max_players_on_field,
  ].every((value) => read_numeric_override(value).status === OptionStatus.SOME);
}
