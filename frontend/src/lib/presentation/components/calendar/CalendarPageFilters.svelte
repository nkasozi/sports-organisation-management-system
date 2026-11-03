<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Team } from "$lib/core/entities/Team";
    import { build_named_record_options_with_blank } from "$lib/presentation/components/ui/searchable_select_options";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    export let teams: Team[];
    export let competitions: Competition[];
    export let categories: ActivityCategory[];
    export let filter_category_id: string;
    export let filter_competition_id: string;
    export let filter_team_id: string;
    export let filter_loading: boolean;
    export let can_user_add_categories: boolean;
    export let on_filter_change: () => Promise<void>;
    export let on_clear_filters: () => Promise<void>;
    export let on_open_category_modal: () => void;

    $: category_options = build_named_record_options_with_blank(
        "All Categories",
        categories,
    );
    $: competition_options = build_named_record_options_with_blank(
        "All Competitions",
        competitions,
    );
    $: team_options = build_named_record_options_with_blank("All Teams", teams);

    function choose_category(category_id: string): Promise<void> {
        filter_category_id = category_id;
        return on_filter_change();
    }

    function choose_competition(competition_id: string): Promise<void> {
        filter_competition_id = competition_id;
        return on_filter_change();
    }

    function choose_team(team_id: string): Promise<void> {
        filter_team_id = team_id;
        return on_filter_change();
    }
</script>

<div
    class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
>
    <span class="text-sm font-medium text-accent-700 dark:text-accent-300"
        >Filters:</span
    >
    <div class="w-full sm:w-auto sm:min-w-[180px]">
        <SearchableSelectField
            name="calendar_filter_category"
            value={filter_category_id}
            options={category_options}
            disabled={filter_loading}
            on:change={(event) => void choose_category(event.detail.value)}
        />
    </div>
    <div class="w-full sm:w-auto sm:min-w-[180px]">
        <SearchableSelectField
            name="calendar_filter_competition"
            value={filter_competition_id}
            options={competition_options}
            disabled={filter_loading}
            on:change={(event) => void choose_competition(event.detail.value)}
        />
    </div>
    <div class="w-full sm:w-auto sm:min-w-[180px]">
        <SearchableSelectField
            name="calendar_filter_team"
            value={filter_team_id}
            options={team_options}
            disabled={filter_loading}
            on:change={(event) => void choose_team(event.detail.value)}
        />
    </div>
    {#if filter_category_id || filter_competition_id || filter_team_id}
        <button
            type="button"
            disabled={filter_loading}
            class="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
            on:click={() => void on_clear_filters()}>Clear Filters</button
        >
    {/if}
    {#if filter_loading}
        <div class="flex items-center gap-2 text-sm text-accent-500">
            <svg
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                ><circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                ></circle><path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path></svg
            >Filtering...
        </div>
    {/if}
    {#if can_user_add_categories}
        <button
            type="button"
            class="ml-auto text-sm text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100"
            on:click={on_open_category_modal}>+ New Category</button
        >
    {/if}
</div>
