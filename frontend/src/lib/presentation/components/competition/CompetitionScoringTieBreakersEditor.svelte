<script lang="ts">
    import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";

    export let is_customizing_scoring: boolean;
    export let effective_tie_breakers: TieBreaker[];
    export let on_toggle_tie_breaker: (
        tie_breaker: TieBreaker,
        enabled: boolean,
    ) => void;
    export let on_enable_customization: () => void;

    const all_tie_breakers: { value: TieBreaker; label: string }[] = [
        { value: "goal_difference", label: "Goal Difference" },
        { value: "head_to_head", label: "Head to Head" },
        { value: "goals_scored", label: "Goals Scored" },
        { value: "away_goals", label: "Away Goals" },
        { value: "fair_play", label: "Fair Play" },
        { value: "draw", label: "Draw (Lot)" },
        { value: "playoff", label: "Playoff" },
    ];
</script>

<div>
    <div class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-2">
        Tie-breakers <span class="text-xs text-accent-500 ml-1"
            >(first checked = highest priority)</span
        >
    </div>
    <div
        class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
    >
        <div class="flex items-center gap-2">
            <span class="text-sm text-accent-500 dark:text-accent-400"
                >Current:</span
            >
            <span
                class="text-sm font-semibold text-accent-900 dark:text-accent-100"
            >
                {effective_tie_breakers.join(" → ")}
            </span>
        </div>
    </div>

    {#if !is_customizing_scoring}
        <button
            type="button"
            on:click={on_enable_customization}
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
