<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import {
        add_game_period,
        remove_game_period,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;

    function handle_add_period(): void {
        form_data = add_game_period(form_data);
    }

    function handle_remove_period(index: number): void {
        form_data = remove_game_period(form_data, index);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Game Periods
        </h3>
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_add_period}>Add Period</button
        >
    </div>

    {#if form_data.periods.length === 0}
        <p class="text-center py-8 text-accent-500 dark:text-accent-400">
            No game periods defined. Add periods to configure game structure.
        </p>
    {:else}
        <div class="space-y-3">
            {#each form_data.periods as current_period, index}
                <div
                    class="flex flex-wrap items-center gap-4 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                >
                    <span
                        class="text-sm font-medium text-accent-500 dark:text-accent-400 w-8"
                        >#{current_period.order}</span
                    >
                    <input
                        type="text"
                        class="flex-1 min-w-32 input"
                        bind:value={current_period.name}
                        placeholder="Period name"
                    />
                    <div class="flex items-center gap-2">
                        <input
                            type="number"
                            class="w-20 input"
                            bind:value={current_period.duration_minutes}
                            placeholder="Min"
                            min="1"
                        />
                        <span
                            class="text-sm text-accent-500 dark:text-accent-400"
                            >min</span
                        >
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            bind:checked={current_period.is_break}
                            class="rounded"
                        />
                        <span class="text-accent-700 dark:text-accent-300"
                            >Break</span
                        >
                    </label>
                    <button
                        type="button"
                        aria-label="Remove game period"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        on:click={() => handle_remove_period(index)}
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
