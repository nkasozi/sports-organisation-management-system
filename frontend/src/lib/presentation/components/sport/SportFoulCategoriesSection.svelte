<script lang="ts">
    import type {
        CreateSportInput,
        FoulCategory,
    } from "$lib/core/entities/Sport";
    import {
        build_named_record_options_with_blank,
        keep_first_option_per_value,
    } from "$lib/presentation/components/ui/searchable_select_options";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";
    import {
        add_foul_category,
        generate_sport_identifier,
        remove_foul_category,
        SPORT_FOUL_SEVERITY_OPTIONS,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;

    function handle_add_foul_category(): void {
        form_data = add_foul_category(form_data);
    }

    function handle_remove_foul_category(index: number): void {
        form_data = remove_foul_category(form_data, index);
    }

    $: card_options = keep_first_option_per_value(
        build_named_record_options_with_blank("No Card", form_data.card_types),
    );

    function choose_foul_severity(
        index: number,
        selected_value: string,
    ): boolean {
        form_data.foul_categories[index].severity =
            selected_value as FoulCategory["severity"];
        return true;
    }

    function choose_foul_card(index: number, selected_value: string): boolean {
        form_data.foul_categories[index].results_in_card = selected_value;
        return true;
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Foul Categories
        </h3>
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_add_foul_category}>Add Foul Category</button
        >
    </div>

    {#if form_data.foul_categories.length === 0}
        <p class="text-center py-8 text-accent-500 dark:text-accent-400">
            No foul categories defined. Add categories to track violations.
        </p>
    {:else}
        <div class="space-y-4">
            {#each form_data.foul_categories as current_foul, index}
                <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                >
                    <div class="flex flex-wrap items-center gap-4">
                        <input
                            type="text"
                            class="flex-1 min-w-32 input"
                            bind:value={current_foul.name}
                            placeholder="Foul name (e.g., Personal Foul)"
                            on:change={() =>
                                (current_foul.id = generate_sport_identifier(
                                    current_foul.name,
                                ))}
                        />
                        <div class="w-32">
                            <SearchableSelectField
                                name={`foul_category_severity_${index}`}
                                value={current_foul.severity}
                                options={SPORT_FOUL_SEVERITY_OPTIONS}
                                on:change={(event) =>
                                    choose_foul_severity(
                                        index,
                                        event.detail.value,
                                    )}
                            />
                        </div>
                        <div class="w-36">
                            <SearchableSelectField
                                name={`foul_category_card_${index}`}
                                value={current_foul.results_in_card}
                                options={card_options}
                                placeholder="No Card"
                                on:change={(event) =>
                                    choose_foul_card(index, event.detail.value)}
                            />
                        </div>
                        <button
                            type="button"
                            aria-label="Remove foul category"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            on:click={() => handle_remove_foul_category(index)}
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
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            class="input"
                            bind:value={current_foul.description}
                            placeholder="Description"
                        />
                        <input
                            type="text"
                            class="input"
                            bind:value={current_foul.typical_penalty}
                            placeholder="Typical penalty"
                        />
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
