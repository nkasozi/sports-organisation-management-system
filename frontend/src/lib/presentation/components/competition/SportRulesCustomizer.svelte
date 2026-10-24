<script lang="ts">
    import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
    import type { Sport } from "$lib/core/entities/Sport";
    import { get_overtime_type_label } from "$lib/presentation/logic/overtimeTypeLabels";
    import {
        format_periods_summary,
        get_effective_periods,
        get_max_players_on_field,
        get_max_squad_size,
        get_max_substitutions,
        get_min_players_on_field,
        get_overtime_enabled,
        get_return_after_substitution,
        get_rolling_substitutions,
        has_custom_squad_limits,
        has_rule_override,
    } from "$lib/presentation/logic/sportRulesCustomizerLogic";
    import {
        apply_sport_rules_override_action,
        create_sport_rules_customizing_state,
        set_sport_rules_section_customizing,
        SPORT_RULES_FLAG_ACTION as FLAG_ACTION,
        SPORT_RULES_NUMBER_ACTION as NUMBER_ACTION,
        SPORT_RULES_SECTION as SECTION,
        SPORT_RULES_STRUCTURE_ACTION as STRUCTURE_ACTION,
        type SportRulesFlagAction,
        type SportRulesNumberAction,
        type SportRulesOverrideAction,
        type SportRulesSection,
    } from "$lib/presentation/logic/sportRulesOverrideActions";

    import SportRulesEmptyState from "./SportRulesEmptyState.svelte";
    import SportRulesOvertimeSection from "./SportRulesOvertimeSection.svelte";
    import SportRulesPeriodsSection from "./SportRulesPeriodsSection.svelte";
    import SportRulesSquadLimitsSection from "./SportRulesSquadLimitsSection.svelte";
    import SportRulesSubstitutionsSection from "./SportRulesSubstitutionsSection.svelte";

    export let sport: Sport | undefined;
    export let rule_overrides: CompetitionRuleOverrides = {};

    let customizing_state = create_sport_rules_customizing_state();

    function apply_action(action: SportRulesOverrideAction): void {
        rule_overrides = apply_sport_rules_override_action(
            rule_overrides,
            action,
        );
    }

    function set_customizing(
        section: SportRulesSection,
        is_customizing: boolean,
    ): void {
        customizing_state = set_sport_rules_section_customizing(
            customizing_state,
            section,
            is_customizing,
        );
    }

    function reset_section(section: SportRulesSection): void {
        apply_action({ type: STRUCTURE_ACTION.RESET_SECTION, section });
        set_customizing(section, false);
    }

    const update_number =
        (type: SportRulesNumberAction) =>
        (value: number): void =>
            apply_action({ type, value });
    const update_flag =
        (type: SportRulesFlagAction) =>
        (value: boolean): void =>
            apply_action({ type, value });
</script>

<div class="space-y-6">
    {#if !sport}
        <SportRulesEmptyState />
    {:else}
        <div
            class="border border-accent-200 dark:border-accent-700 rounded-lg p-6"
        >
            <h3
                class="mb-6 text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
                Customize Sport Rules <span class="text-primary-600"
                    >{sport.name}</span
                >
            </h3>
            <div class="space-y-6">
                <SportRulesPeriodsSection
                    periods={rule_overrides.periods ?? [
                        ...(sport.periods ?? []),
                    ]}
                    current_summary={format_periods_summary(
                        get_effective_periods(rule_overrides, sport),
                    )}
                    default_summary={format_periods_summary(
                        sport.periods ?? [],
                    )}
                    has_custom_periods={has_rule_override(
                        rule_overrides,
                        "periods",
                    )}
                    is_customizing_periods={customizing_state.periods}
                    on_customize={() => set_customizing(SECTION.PERIODS, true)}
                    on_periods_change={(periods) =>
                        apply_action({
                            type: STRUCTURE_ACTION.SET_PERIODS,
                            periods,
                        })}
                    on_reset={() => reset_section(SECTION.PERIODS)}
                />
                <SportRulesSquadLimitsSection
                    {sport}
                    current_max_players={get_max_players_on_field(
                        rule_overrides,
                        sport,
                    )}
                    current_min_players={get_min_players_on_field(
                        rule_overrides,
                        sport,
                    )}
                    current_max_squad={get_max_squad_size(
                        rule_overrides,
                        sport,
                    )}
                    has_custom_limits={has_custom_squad_limits(rule_overrides)}
                    is_customizing_squad_limits={customizing_state.squad_limits}
                    on_customize={() =>
                        set_customizing(SECTION.SQUAD_LIMITS, true)}
                    on_reset={() => reset_section(SECTION.SQUAD_LIMITS)}
                    on_max_players_change={update_number(
                        NUMBER_ACTION.SET_MAX_PLAYERS,
                    )}
                    on_min_players_change={update_number(
                        NUMBER_ACTION.SET_MIN_PLAYERS,
                    )}
                    on_max_squad_change={update_number(
                        NUMBER_ACTION.SET_MAX_SQUAD,
                    )}
                />
                <SportRulesSubstitutionsSection
                    {sport}
                    current_max_substitutions={get_max_substitutions(
                        rule_overrides,
                        sport,
                    )}
                    current_rolling_substitutions={get_rolling_substitutions(
                        rule_overrides,
                        sport,
                    )}
                    current_return_after_substitution={get_return_after_substitution(
                        rule_overrides,
                        sport,
                    )}
                    has_custom_substitutions={Boolean(
                        rule_overrides.substitution_rules,
                    )}
                    is_customizing_substitutions={customizing_state.substitutions}
                    on_customize={() =>
                        set_customizing(SECTION.SUBSTITUTIONS, true)}
                    on_reset={() => reset_section(SECTION.SUBSTITUTIONS)}
                    on_max_substitutions_change={update_number(
                        NUMBER_ACTION.SET_MAX_SUBSTITUTIONS,
                    )}
                    on_rolling_substitutions_change={update_flag(
                        FLAG_ACTION.SET_ROLLING_SUBSTITUTIONS,
                    )}
                    on_return_after_substitution_change={update_flag(
                        FLAG_ACTION.SET_RETURN_AFTER_SUBSTITUTION,
                    )}
                />
                <SportRulesOvertimeSection
                    current_overtime_enabled={get_overtime_enabled(
                        rule_overrides,
                        sport,
                    )}
                    default_overtime_enabled={sport.overtime_rules.is_enabled}
                    default_overtime_type={get_overtime_type_label(
                        sport.overtime_rules.overtime_type,
                    )}
                    has_custom_overtime={Boolean(rule_overrides.overtime_rules)}
                    is_customizing_overtime={customizing_state.overtime}
                    on_customize={() => set_customizing(SECTION.OVERTIME, true)}
                    on_reset={() => reset_section(SECTION.OVERTIME)}
                    on_overtime_enabled_change={update_flag(
                        FLAG_ACTION.SET_OVERTIME_ENABLED,
                    )}
                />
            </div>
        </div>
    {/if}
</div>
