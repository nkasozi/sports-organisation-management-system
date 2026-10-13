import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

const DEFAULT_MAX_PLAYERS_ON_FIELD = 11;
const DEFAULT_MIN_PLAYERS_ON_FIELD = 7;
const DEFAULT_MAX_SQUAD_SIZE = 20;
const DEFAULT_MAX_SUBSTITUTIONS = 5;

function resolve_rule_value<T>(
  override_value: T | undefined,
  sport_value: T | undefined,
  fallback_value: T,
): T {
  return override_value ?? sport_value ?? fallback_value;
}

export function get_total_playing_time(
  periods: EditableSportGamePeriod[],
): number {
  return periods
    .filter((p) => !p.is_break)
    .reduce((sum, p) => sum + p.duration_minutes, 0);
}

export function format_periods_summary(
  periods: EditableSportGamePeriod[],
): string {
  const total_time = get_total_playing_time(periods);
  const period_count = periods.filter((p) => !p.is_break).length;

  switch (period_count) {
    case 0:
      return "No periods defined";
    case 2:
      return `2 halves (${total_time} min)`;
    case 4:
      return `4 quarters (${total_time} min)`;
    case 3:
      return `3 periods (${total_time} min)`;
    default:
      return `${period_count} periods (${total_time} min)`;
  }
}

export function get_effective_periods(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): EditableSportGamePeriod[] {
  return rule_overrides.periods ?? sport.periods ?? [];
}

export function get_max_players_on_field(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): number {
  return resolve_rule_value(
    rule_overrides.max_players_on_field,
    sport.max_players_on_field,
    DEFAULT_MAX_PLAYERS_ON_FIELD,
  );
}

export function get_min_players_on_field(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): number {
  return resolve_rule_value(
    rule_overrides.min_players_on_field,
    sport.min_players_on_field,
    DEFAULT_MIN_PLAYERS_ON_FIELD,
  );
}

export function get_max_squad_size(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): number {
  return resolve_rule_value(
    rule_overrides.max_squad_size,
    sport.max_squad_size,
    DEFAULT_MAX_SQUAD_SIZE,
  );
}

export function get_max_substitutions(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): number {
  return resolve_rule_value(
    rule_overrides.substitution_rules?.max_substitutions_per_game,
    sport.substitution_rules.max_substitutions_per_game,
    DEFAULT_MAX_SUBSTITUTIONS,
  );
}

export function get_rolling_substitutions(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): boolean {
  return resolve_rule_value(
    rule_overrides.substitution_rules?.rolling_substitutions_allowed,
    sport.substitution_rules.rolling_substitutions_allowed,
    false,
  );
}

export function get_return_after_substitution(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): boolean {
  return resolve_rule_value(
    rule_overrides.substitution_rules?.return_after_substitution_allowed,
    sport.substitution_rules.return_after_substitution_allowed,
    false,
  );
}

export function get_overtime_enabled(
  rule_overrides: CompetitionRuleOverrides,
  sport: Sport,
): boolean {
  return resolve_rule_value(
    rule_overrides.overtime_rules?.is_enabled,
    sport.overtime_rules.is_enabled,
    true,
  );
}

export function has_rule_override(
  rule_overrides: CompetitionRuleOverrides,
  field_name: keyof CompetitionRuleOverrides,
): boolean {
  return Object.prototype.hasOwnProperty.call(rule_overrides, field_name);
}

export function has_custom_squad_limits(
  rule_overrides: CompetitionRuleOverrides,
): boolean {
  return (
    has_rule_override(rule_overrides, "max_players_on_field") ||
    has_rule_override(rule_overrides, "min_players_on_field") ||
    has_rule_override(rule_overrides, "max_squad_size")
  );
}

const UNLIMITED_SUBSTITUTIONS_LABEL = "Unlimited subs";
const SUBSTITUTIONS_SUFFIX = "subs";

export function format_substitution_limit(max_substitutions: number): string {
  return max_substitutions < 0
    ? UNLIMITED_SUBSTITUTIONS_LABEL
    : `${max_substitutions} ${SUBSTITUTIONS_SUFFIX}`;
}
