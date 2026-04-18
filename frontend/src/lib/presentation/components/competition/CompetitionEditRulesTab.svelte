<script lang="ts">
    import type {
        CompetitionRuleOverrides,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type {
        TieBreaker,
    } from "$lib/core/entities/CompetitionFormat";
    import type {
        CompetitionEditSelectedFormatState,
        CompetitionEditSelectedSportState,
    } from "$lib/presentation/logic/competitionEditPageContracts";

    import CompetitionCreateRulesTab from "./CompetitionCreateRulesTab.svelte";
    import CompetitionScoringOverrides from "./CompetitionScoringOverrides.svelte";

    export let form_data: UpdateCompetitionInput;
    export let selected_format_state: CompetitionEditSelectedFormatState = {
        status: "missing",
    };
    export let selected_sport_state: CompetitionEditSelectedSportState = {
        status: "missing",
    };
    export let is_customizing_scoring: boolean;
    export let can_edit_competition: boolean;
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_update_points: (
        field: "points_for_win" | "points_for_draw" | "points_for_loss",
        raw_value: string,
    ) => void;
    export let on_toggle_tie_breaker: (
        tie_breaker: TieBreaker,
        enabled: boolean,
    ) => void;
    export let on_reset_scoring: () => void;

    let competition_rule_overrides: CompetitionRuleOverrides = {};

    $: competition_rule_overrides =
        form_data.rule_overrides ?? competition_rule_overrides;
    $: form_data.rule_overrides = competition_rule_overrides;
</script>

<form class="space-y-6" on:submit|preventDefault={() => void on_submit()}>
    <div class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4">
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Sport Rules
        </h2>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            Customize competition-specific rules inherited from the sport
        </p>
    </div>
    <CompetitionScoringOverrides
        {selected_format_state}
        bind:form_data
        bind:is_customizing_scoring
        {on_update_points}
        {on_toggle_tie_breaker}
        {on_reset_scoring}
    />
    <CompetitionCreateRulesTab
        organization_id={form_data.organization_id ?? ""}
        selected_sport_state={
            selected_sport_state.status === "present"
                ? {
                      status: "present",
                      sport: selected_sport_state.sport,
                  }
                : { status: "missing" }
        }
        bind:rule_overrides={competition_rule_overrides}
    />

    <div
        class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-accent-200 dark:border-accent-700 pt-6"
    >
        <button
            type="button"
            class="btn btn-outline w-full sm:w-auto"
            disabled={is_saving}
            on:click={on_cancel}>Cancel</button
        >
        {#if can_edit_competition}
            <button
                type="submit"
                class="btn btn-primary-action w-full sm:w-auto"
                disabled={is_saving}
            >
                {#if is_saving}
                    <span class="flex items-center justify-center"
                        ><span
                            class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
                        ></span>Saving...</span
                    >
                {:else}
                    Save Rules
                {/if}
            </button>
        {/if}
    </div>
</form>
