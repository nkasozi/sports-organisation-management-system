<script lang="ts">
  import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
  import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";

  import SportRulesEmptyState from "./SportRulesEmptyState.svelte";
  import SportRulesOvertimeSection from "./SportRulesOvertimeSection.svelte";
  import SportRulesPeriodsSection from "./SportRulesPeriodsSection.svelte";
  import SportRulesSquadLimitsSection from "./SportRulesSquadLimitsSection.svelte";
  import SportRulesSubstitutionsSection from "./SportRulesSubstitutionsSection.svelte";

  export let sport: Sport | null = null;
  export let rule_overrides: CompetitionRuleOverrides = {};

  let is_customizing_periods: boolean = false;
  let is_customizing_squad_limits: boolean = false;
  let is_customizing_substitutions: boolean = false;
  let is_customizing_overtime: boolean = false;

  function resolve_rule_value<T>(
    override_value: T | undefined,
    sport_value: T | undefined,
    fallback_value: T,
  ): T {
    return override_value ?? sport_value ?? fallback_value;
  }

  function get_substitution_rules(): NonNullable<
    CompetitionRuleOverrides["substitution_rules"]
  > {
    rule_overrides.substitution_rules ??= {};
    return rule_overrides.substitution_rules;
  }

  function get_overtime_rules(): NonNullable<
    CompetitionRuleOverrides["overtime_rules"]
  > {
    rule_overrides.overtime_rules ??= {};
    return rule_overrides.overtime_rules;
  }

  function get_effective_periods(): SportGamePeriod[] {
    return rule_overrides.periods ?? sport?.periods ?? [];
  }

  function get_total_playing_time(periods: SportGamePeriod[]): number {
    return periods
      .filter((p) => !p.is_break)
      .reduce((sum, p) => sum + p.duration_minutes, 0);
  }

  function format_periods_summary(periods: SportGamePeriod[]): string {
    const playing_periods = periods.filter((p) => !p.is_break);
    const total_time = get_total_playing_time(periods);
    const period_count = playing_periods.length;

    if (period_count === 0) return "No periods defined";
    if (period_count === 2) return `2 halves (${total_time} min)`;
    if (period_count === 4) return `4 quarters (${total_time} min)`;
    if (period_count === 3) return `3 periods (${total_time} min)`;
    return `${period_count} periods (${total_time} min)`;
  }

  function get_max_players_on_field(): number {
    return resolve_rule_value(
      rule_overrides.max_players_on_field,
      sport?.max_players_on_field,
      11,
    );
  }

  function get_min_players_on_field(): number {
    return resolve_rule_value(
      rule_overrides.min_players_on_field,
      sport?.min_players_on_field,
      7,
    );
  }

  function get_max_squad_size(): number {
    return resolve_rule_value(
      rule_overrides.max_squad_size,
      sport?.max_squad_size,
      20,
    );
  }

  function get_max_substitutions(): number {
    return resolve_rule_value(
      rule_overrides.substitution_rules?.max_substitutions_per_game,
      sport?.substitution_rules.max_substitutions_per_game,
      5,
    );
  }

  function get_rolling_substitutions(): boolean {
    return resolve_rule_value(
      rule_overrides.substitution_rules?.rolling_substitutions_allowed,
      sport?.substitution_rules.rolling_substitutions_allowed,
      false,
    );
  }

  function get_return_after_substitution(): boolean {
    return resolve_rule_value(
      rule_overrides.substitution_rules?.return_after_substitution_allowed,
      sport?.substitution_rules.return_after_substitution_allowed,
      false,
    );
  }

  function get_overtime_enabled(): boolean {
    return resolve_rule_value(
      rule_overrides.overtime_rules?.is_enabled,
      sport?.overtime_rules.is_enabled,
      true,
    );
  }

  function handle_periods_change(event: CustomEvent<SportGamePeriod[]>): void {
    rule_overrides.periods = event.detail;
    rule_overrides.game_duration_minutes = get_total_playing_time(event.detail);
  }

  function update_max_players(value: number): void {
    rule_overrides.max_players_on_field = value;
  }

  function update_min_players(value: number): void {
    rule_overrides.min_players_on_field = value;
  }

  function update_max_squad(value: number): void {
    rule_overrides.max_squad_size = value;
  }

  function update_max_substitutions(value: number): void {
    get_substitution_rules().max_substitutions_per_game = value;
  }

  function update_rolling_substitutions(value: boolean): void {
    get_substitution_rules().rolling_substitutions_allowed = value;
  }

  function update_return_after_substitution(value: boolean): void {
    get_substitution_rules().return_after_substitution_allowed = value;
  }

  function update_overtime_enabled(value: boolean): void {
    get_overtime_rules().is_enabled = value;
  }

  function reset_game_periods(): void {
    rule_overrides.periods = undefined;
    rule_overrides.game_duration_minutes = undefined;
    is_customizing_periods = false;
  }

  function reset_squad_limits(): void {
    rule_overrides.max_players_on_field = undefined;
    rule_overrides.min_players_on_field = undefined;
    rule_overrides.max_squad_size = undefined;
    is_customizing_squad_limits = false;
  }

  function reset_substitutions(): void {
    rule_overrides.substitution_rules = undefined;
    is_customizing_substitutions = false;
  }

  function reset_overtime(): void {
    rule_overrides.overtime_rules = undefined;
    is_customizing_overtime = false;
  }
</script>

<div class="space-y-6">
  {#if !sport}
    <SportRulesEmptyState />
  {:else}
    <div class="border border-accent-200 dark:border-accent-700 rounded-lg p-6">
      <h3
        class="mb-6 text-lg font-semibold text-accent-900 dark:text-accent-100"
      >
        Customize Sport Rules <span class="text-primary-600">{sport.name}</span>
      </h3>
      <div class="space-y-6">
        <SportRulesPeriodsSection
          periods={rule_overrides.periods ?? [...(sport.periods ?? [])]}
          current_summary={format_periods_summary(get_effective_periods())}
          default_summary={format_periods_summary(sport.periods ?? [])}
          has_custom_periods={rule_overrides.periods !== undefined}
          {is_customizing_periods}
          on_customize={() => (is_customizing_periods = true)}
          on_periods_change={(periods) =>
            handle_periods_change({ detail: periods } as CustomEvent)}
          on_reset={reset_game_periods}
        />
        <SportRulesSquadLimitsSection
          {sport}
          current_max_players={get_max_players_on_field()}
          current_min_players={get_min_players_on_field()}
          current_max_squad={get_max_squad_size()}
          has_custom_limits={rule_overrides.max_players_on_field !==
            undefined ||
            rule_overrides.min_players_on_field !== undefined ||
            rule_overrides.max_squad_size !== undefined}
          {is_customizing_squad_limits}
          on_customize={() => (is_customizing_squad_limits = true)}
          on_reset={reset_squad_limits}
          on_max_players_change={update_max_players}
          on_min_players_change={update_min_players}
          on_max_squad_change={update_max_squad}
        />
        <SportRulesSubstitutionsSection
          {sport}
          current_max_substitutions={get_max_substitutions()}
          current_rolling_substitutions={get_rolling_substitutions()}
          current_return_after_substitution={get_return_after_substitution()}
          has_custom_substitutions={Boolean(rule_overrides.substitution_rules)}
          {is_customizing_substitutions}
          on_customize={() => (is_customizing_substitutions = true)}
          on_reset={reset_substitutions}
          on_max_substitutions_change={update_max_substitutions}
          on_rolling_substitutions_change={update_rolling_substitutions}
          on_return_after_substitution_change={update_return_after_substitution}
        />
        <SportRulesOvertimeSection
          current_overtime_enabled={get_overtime_enabled()}
          default_overtime_enabled={sport.overtime_rules.is_enabled}
          default_overtime_type={sport.overtime_rules.overtime_type}
          has_custom_overtime={Boolean(rule_overrides.overtime_rules)}
          {is_customizing_overtime}
          on_customize={() => (is_customizing_overtime = true)}
          on_reset={reset_overtime}
          on_overtime_enabled_change={update_overtime_enabled}
        />
      </div>
    </div>
  {/if}
</div>
