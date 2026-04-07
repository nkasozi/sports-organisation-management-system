<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import {
        add_official_requirement,
        generate_sport_identifier,
        remove_official_requirement,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;

    function handle_add_official_requirement(): void {
        form_data = add_official_requirement(form_data);
    }

    function handle_remove_official_requirement(index: number): void {
        form_data = remove_official_requirement(form_data, index);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Official Requirements
        </h3>
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_add_official_requirement}>Add Official Role</button
        >
    </div>

    {#if form_data.official_requirements.length === 0}
        <p class="text-center py-8 text-accent-500 dark:text-accent-400">
            No official requirements defined. Add roles for game officiating.
        </p>
    {:else}
        <div class="space-y-4">
            {#each form_data.official_requirements as current_official, index}
                <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                >
                    <div class="flex flex-wrap items-center gap-4">
                        <input
                            type="text"
                            class="flex-1 min-w-32 input"
                            bind:value={current_official.role_name}
                            placeholder="Role name (e.g., Main Referee)"
                            on:change={() =>
                                (current_official.role_id =
                                    generate_sport_identifier(
                                        current_official.role_name,
                                    ))}
                        />
                        <div class="flex items-center gap-2">
                            <span
                                class="text-sm text-accent-500 dark:text-accent-400"
                                >Min:</span
                            >
                            <input
                                type="number"
                                class="w-16 input"
                                bind:value={current_official.minimum_count}
                                min="0"
                            />
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="text-sm text-accent-500 dark:text-accent-400"
                                >Max:</span
                            >
                            <input
                                type="number"
                                class="w-16 input"
                                bind:value={current_official.maximum_count}
                                min="1"
                            />
                        </div>
                        <label class="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                bind:checked={current_official.is_mandatory}
                                class="rounded"
                            />
                            <span class="text-accent-700 dark:text-accent-300"
                                >Mandatory</span
                            >
                        </label>
                        <button
                            type="button"
                            aria-label="Remove official requirement"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            on:click={() =>
                                handle_remove_official_requirement(index)}
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
                    <input
                        type="text"
                        class="w-full input"
                        bind:value={current_official.description}
                        placeholder="Description of the official's role"
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>
