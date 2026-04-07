<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import {
        add_scoring_rule,
        remove_scoring_rule,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;

    function handle_add_scoring_rule(): void {
        form_data = add_scoring_rule(form_data);
    }

    function handle_remove_scoring_rule(index: number): void {
        form_data = remove_scoring_rule(form_data, index);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Scoring Rules
        </h3>
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_add_scoring_rule}>Add Scoring Rule</button
        >
    </div>

    {#if form_data.scoring_rules.length === 0}
        <p class="text-center py-8 text-accent-500 dark:text-accent-400">
            No scoring rules defined. Add rules for how points are scored.
        </p>
    {:else}
        <div class="space-y-3">
            {#each form_data.scoring_rules as current_rule, index}
                <div
                    class="flex flex-wrap items-center gap-4 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                >
                    <input
                        type="text"
                        class="flex-1 min-w-32 input"
                        bind:value={current_rule.event_type}
                        placeholder="Event type (e.g., goal, 3_pointer)"
                    />
                    <div class="flex items-center gap-2">
                        <span
                            class="text-sm text-accent-500 dark:text-accent-400"
                            >Points:</span
                        >
                        <input
                            type="number"
                            class="w-16 input"
                            bind:value={current_rule.points_awarded}
                            min="1"
                        />
                    </div>
                    <input
                        type="text"
                        class="flex-1 min-w-48 input"
                        bind:value={current_rule.description}
                        placeholder="Description"
                    />
                    <button
                        type="button"
                        aria-label="Remove scoring rule"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        on:click={() => handle_remove_scoring_rule(index)}
                    >
                        <svg
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>
