<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import {
        add_card_type,
        generate_sport_identifier,
        remove_card_type,
        SPORT_CARD_SEVERITY_OPTIONS,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;

    function handle_add_card_type(): void {
        form_data = add_card_type(form_data);
    }

    function handle_remove_card_type(index: number): void {
        form_data = remove_card_type(form_data, index);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Card Types
        </h3>
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_add_card_type}>Add Card Type</button
        >
    </div>

    {#if form_data.card_types.length === 0}
        <p class="text-center py-8 text-accent-500 dark:text-accent-400">
            No card types defined. Add cards for disciplinary actions.
        </p>
    {:else}
        <div class="space-y-4">
            {#each form_data.card_types as current_card, index}
                <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                >
                    <div class="flex flex-wrap items-center gap-4">
                        <input
                            type="color"
                            class="w-10 h-10 rounded cursor-pointer border-0"
                            bind:value={current_card.color}
                        />
                        <input
                            type="text"
                            class="flex-1 min-w-32 input"
                            bind:value={current_card.name}
                            placeholder="Card name (e.g., Yellow Card)"
                            on:change={() =>
                                (current_card.id = generate_sport_identifier(
                                    current_card.name,
                                ))}
                        />
                        <select
                            class="input w-32"
                            bind:value={current_card.severity}
                        >
                            {#each SPORT_CARD_SEVERITY_OPTIONS as current_option}
                                <option value={current_option.value}
                                    >{current_option.label}</option
                                >
                            {/each}
                        </select>
                        <button
                            type="button"
                            aria-label="Remove card type"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            on:click={() => handle_remove_card_type(index)}
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
                        bind:value={current_card.description}
                        placeholder="Description of when this card is shown"
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>
