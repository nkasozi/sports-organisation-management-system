<script lang="ts">
    import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
    import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";
    import CompetitionScoringPointsEditor from "$lib/presentation/components/competition/CompetitionScoringPointsEditor.svelte";
    import CompetitionScoringTieBreakersEditor from "$lib/presentation/components/competition/CompetitionScoringTieBreakersEditor.svelte";
    import type { CompetitionEditSelectedFormatState } from "$lib/presentation/logic/competitionEditPageContracts";

    export let selected_format_state: CompetitionEditSelectedFormatState = {
        status: "missing",
    };
    export let form_data: UpdateCompetitionInput;
    export let is_customizing_scoring: boolean;
    export let on_update_points: (
        field: "points_for_win" | "points_for_draw" | "points_for_loss",
        raw_value: string,
    ) => void;
    export let on_toggle_tie_breaker: (
        tie_breaker: TieBreaker,
        enabled: boolean,
    ) => void;
    export let on_reset_scoring: () => void;

    $: format_default_points =
        selected_format_state.status === "present"
            ? selected_format_state.competition_format.points_config ?? {
                  points_for_win: 3,
                  points_for_draw: 1,
                  points_for_loss: 0,
              }
            : {
                  points_for_win: 3,
                  points_for_draw: 1,
                  points_for_loss: 0,
              };
    $: effective_points = {
        points_for_win:
            form_data.rule_overrides?.points_config_override?.points_for_win ??
            format_default_points.points_for_win,
        points_for_draw:
            form_data.rule_overrides?.points_config_override?.points_for_draw ??
            format_default_points.points_for_draw,
        points_for_loss:
            form_data.rule_overrides?.points_config_override?.points_for_loss ??
            format_default_points.points_for_loss,
    };
    $: format_default_tie_breakers =
        selected_format_state.status === "present"
            ? (selected_format_state.competition_format.tie_breakers as TieBreaker[])
            : (["goal_difference", "goals_scored"] as TieBreaker[]);
    $: effective_tie_breakers =
        form_data.rule_overrides?.tie_breakers_override ??
        format_default_tie_breakers;
    $: has_scoring_override = !!(
        form_data.rule_overrides?.points_config_override ||
        form_data.rule_overrides?.tie_breakers_override
    );
</script>

{#if selected_format_state.status === "present"}
    <div
        class="border border-accent-200 dark:border-accent-700 rounded-lg p-5 mb-4"
    >
        <div class="flex items-center justify-between mb-4">
            <h3
                class="text-base font-semibold text-accent-900 dark:text-accent-100"
            >
                Scoring System
            </h3>
            {#if has_scoring_override}
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                    >Custom</span
                >
            {/if}
        </div>

        <div class="space-y-5">
            <CompetitionScoringPointsEditor
                {is_customizing_scoring}
                {effective_points}
                {format_default_points}
                {on_update_points}
                on_enable_customization={() => (is_customizing_scoring = true)}
            />

            <CompetitionScoringTieBreakersEditor
                {is_customizing_scoring}
                {effective_tie_breakers}
                {on_toggle_tie_breaker}
                on_enable_customization={() => (is_customizing_scoring = true)}
            />

            {#if is_customizing_scoring && has_scoring_override}
                <button
                    type="button"
                    on:click={on_reset_scoring}
                    class="text-sm text-accent-600 hover:text-accent-700 underline"
                    >Reset to Format Defaults</button
                >
            {/if}
        </div>
    </div>
{/if}
