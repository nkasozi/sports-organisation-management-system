<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import { build_named_record_options } from "$lib/presentation/components/ui/searchable_select_options";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    import CalendarPageFilters from "./CalendarPageFilters.svelte";

    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let selected_organization_name: string;
    export let teams: Team[];
    export let competitions: Competition[];
    export let categories: ActivityCategory[];
    export let filter_category_id: string;
    export let filter_competition_id: string;
    export let filter_team_id: string;
    export let filter_loading: boolean;
    export let can_user_change_organizations: boolean;
    export let can_user_add_activities: boolean;
    export let can_user_add_categories: boolean;
    export let page_subtitle: string;
    export let on_organization_change: () => Promise<void>;
    export let on_open_create_modal: () => void;
    export let on_open_subscribe_modal: () => void;
    export let on_filter_change: () => Promise<void>;
    export let on_clear_filters: () => Promise<void>;
    export let on_open_category_modal: () => void;

    $: organization_options = build_named_record_options(organizations);

    function choose_organization(organization_id: string): Promise<void> {
        selected_organization_id = organization_id;
        return on_organization_change();
    }
</script>

<div
    class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
>
    <div class="flex-1 min-w-0">
        <h2
            class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
        >
            Organization Calendar
        </h2>
        <p class="text-sm text-accent-600 dark:text-accent-400">
            {page_subtitle}
        </p>
    </div>
    <div
        class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto"
    >
        {#if can_user_change_organizations}
            <div class="w-full sm:w-auto min-w-0 sm:min-w-[200px]">
                <SearchableSelectField
                    name="calendar_organization"
                    value={selected_organization_id}
                    options={organization_options}
                    on:change={(event) =>
                        void choose_organization(event.detail.value)}
                />
            </div>
        {:else}
            <span
                class="text-sm font-medium text-accent-700 dark:text-accent-300 px-3 py-2 bg-accent-100 dark:bg-accent-800 rounded-[0.175rem]"
                >{selected_organization_name}</span
            >
        {/if}
        {#if can_user_add_activities}
            <button
                type="button"
                class="btn btn-primary-action whitespace-nowrap"
                on:click={on_open_create_modal}>+ Add Activity</button
            >
        {/if}
        <button
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-[0.175rem] border-2 border-primary-500 dark:border-primary-400 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 whitespace-nowrap flex items-center gap-2 transition-colors shadow-sm"
            on:click={on_open_subscribe_modal}
        >
            <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                /></svg
            >Subscribe to Calendar</button
        >
    </div>
</div>

<CalendarPageFilters
    {teams}
    {competitions}
    {categories}
    bind:filter_category_id
    bind:filter_competition_id
    bind:filter_team_id
    {filter_loading}
    {can_user_add_categories}
    {on_filter_change}
    {on_clear_filters}
    {on_open_category_modal}
/>

<div class="flex flex-wrap gap-2 pb-2">
    {#each categories as category}
        <span
            class="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-[0.175rem]"
            style={`background-color: ${category.color}20; color: ${category.color};`}
        >
            <span
                class="w-2 h-2 rounded-full"
                style={`background-color: ${category.color};`}
            ></span>
            {category.name}
        </span>
    {/each}
</div>
