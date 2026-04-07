<script lang="ts">
    import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
    import type {
        CompetitionFormat,
        TieBreaker,
    } from "$lib/core/entities/CompetitionFormat";

    export let selected_format: CompetitionFormat | null;
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

    const all_tie_breakers: { value: TieBreaker; label: string }[] = [
        { value: "goal_difference", label: "Goal Difference" },
        { value: "head_to_head", label: "Head to Head" },
        { value: "goals_scored", label: "Goals Scored" },
        { value: "away_goals", label: "Away Goals" },
        { value: "fair_play", label: "Fair Play" },
        { value: "draw", label: "Draw (Lot)" },
        { value: "playoff", label: "Playoff" },
    ];

    $: format_default_points = selected_format?.points_config ?? {
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
    $: format_default_tie_breakers = (selected_format?.tie_breakers ?? [
        "goal_difference",
        "goals_scored",
    ]) as TieBreaker[];
    $: effective_tie_breakers =
        form_data.rule_overrides?.tie_breakers_override ??
        format_default_tie_breakers;
    $: has_scoring_override = !!(
        form_data.rule_overrides?.points_config_override ||
        form_data.rule_overrides?.tie_breakers_override
    );
</script>

{#if selected_format}
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
            <div class="border-b border-accent-200 dark:border-accent-700 pb-5">
                <div
                    class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-2"
                >
                    Points Per Result
                </div>
                <div
                    class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="text-sm text-accent-500 dark:text-accent-400"
                            >Current:</span
                        >
                        <span
                            class="text-sm font-semibold text-accent-900 dark:text-accent-100"
                            >Win {effective_points.points_for_win} / Draw {effective_points.points_for_draw}
                            / Loss {effective_points.points_for_loss}</span
                        >
                    </div>
                    <div class="text-accent-300 dark:text-accent-600">|</div>
                    <div class="flex items-center gap-2">
                        <span
                            class="text-sm text-accent-500 dark:text-accent-400"
                            >Format default:</span
                        >
                        <span
                            class="text-sm text-accent-600 dark:text-accent-400"
                            >Win {format_default_points.points_for_win} / Draw {format_default_points.points_for_draw}
                            / Loss {format_default_points.points_for_loss}</span
                        >
                    </div>
                </div>

                {#if !is_customizing_scoring}
                    <button
                        type="button"
                        on:click={() => (is_customizing_scoring = true)}
                        class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >Customize</button
                    >
                {:else}
                    <div class="mt-3 grid grid-cols-3 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                                for="pts_win">Win</label
                            >
                            <input
                                id="pts_win"
                                type="number"
                                value={effective_points.points_for_win}
                                on:change={(event) =>
                                    on_update_points(
                                        "points_for_win",
                                        event.currentTarget.value,
                                    )}
                                min={0}
                                max={99}
                                class="block w-full px-3 py-2 border border-accent-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                                for="pts_draw">Draw</label
                            >
                            <input
                                id="pts_draw"
                                type="number"
                                value={effective_points.points_for_draw}
                                on:change={(event) =>
                                    on_update_points(
                                        "points_for_draw",
                                        event.currentTarget.value,
                                    )}
                                min={0}
                                max={99}
                                class="block w-full px-3 py-2 border border-accent-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                                for="pts_loss">Loss</label
                            >
                            <input
                                id="pts_loss"
                                type="number"
                                value={effective_points.points_for_loss}
                                on:change={(event) =>
                                    on_update_points(
                                        "points_for_loss",
                                        event.currentTarget.value,
                                    )}
                                min={0}
                                max={99}
                                class="block w-full px-3 py-2 border border-accent-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                            />
                        </div>
                    </div>
                {/if}
            </div>

            <div>
                <div
                    class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-2"
                >
                    Tie-breakers <span class="text-xs text-accent-500 ml-1"
                        >(first checked = highest priority)</span
                    >
                </div>
                <div
                    class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="text-sm text-accent-500 dark:text-accent-400"
                            >Current:</span
                        >
                        <span
                            class="text-sm font-semibold text-accent-900 dark:text-accent-100"
                            >{effective_tie_breakers.join(" → ")}</span
                        >
                    </div>
                </div>

                {#if !is_customizing_scoring}
                    <button
                        type="button"
                        on:click={() => (is_customizing_scoring = true)}
                        class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >Customize</button
                    >
                {:else}
                    <div class="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {#each all_tie_breakers as tie_breaker}
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm text-accent-800 dark:text-accent-200"
                            >
                                <input
                                    type="checkbox"
                                    checked={effective_tie_breakers.includes(
                                        tie_breaker.value,
                                    )}
                                    on:change={(event) =>
                                        on_toggle_tie_breaker(
                                            tie_breaker.value,
                                            event.currentTarget.checked,
                                        )}
                                    class="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                                />
                                {tie_breaker.label}
                            </label>
                        {/each}
                    </div>
                {/if}
            </div>

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
