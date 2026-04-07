<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import CalendarScheduleView from "$lib/presentation/components/calendar/CalendarScheduleView.svelte";
    import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    type LoadingState = "idle" | "loading" | "success" | "error";

    export let loading_state: LoadingState;
    export let error_message: string;
    export let is_using_cached_data: boolean;
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let selected_organization_name: string;
    export let teams: Team[];
    export let competitions: Competition[];
    export let categories: ActivityCategory[];
    export let calendar_events: CalendarEvent[];
    export let filter_category_id: string;
    export let filter_competition_id: string;
    export let filter_team_id: string;
    export let filter_loading: boolean;
    export let can_user_change_organizations: boolean;
    export let can_user_add_activities: boolean;
    export let on_organization_change: () => Promise<void>;
    export let on_open_create_modal: () => void;
    export let on_open_subscribe_modal: () => void;
    export let on_filter_change: () => Promise<void>;
    export let on_clear_filters: () => Promise<void>;
    export let on_open_category_modal: () => void;
    export let on_event_click: (event_id: string) => void;
    export let on_date_click: (date_string: string) => void;
    export let on_date_time_click: (
        date_string: string,
        time_string: string,
    ) => void;
</script>

<div class="w-full">
    {#if is_using_cached_data}
        <div
            class="banner-info mx-4 mt-4 mb-2 flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
        >
            <svg
                class="banner-info-icon h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                /></svg
            ><span
                >Showing locally cached data — connect to the internet to get
                the latest calendar events.</span
            >
        </div>
    {/if}
    <LoadingStateWrapper
        state={loading_state}
        loading_text="Loading calendar..."
        {error_message}
    >
        {#if organizations.length === 0}
            <div
                class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 px-4 py-8 text-center sm:mx-0 sm:p-12 sm:border sm:rounded-lg"
            >
                <svg
                    class="mx-auto h-12 w-12 text-accent-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    /></svg
                >
                <h3
                    class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
                >
                    No organizations found
                </h3>
                <p class="mt-2 text-accent-600 dark:text-accent-400">
                    Create an organization first to use the calendar.
                </p>
                <button
                    type="button"
                    class="btn btn-primary-action mt-4"
                    on:click={on_open_create_modal}>Go to Organizations</button
                >
            </div>
        {:else}
            <div
                class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 px-4 pt-4 pb-6 space-y-4 sm:mx-0 sm:px-6 sm:border sm:rounded-lg overflow-hidden"
            >
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
                            View and manage activities, competitions, and
                            fixtures
                        </p>
                    </div>
                    <div
                        class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto"
                    >
                        {#if can_user_change_organizations}<select
                                bind:value={selected_organization_id}
                                class="select-styled w-full sm:w-auto min-w-0 sm:min-w-[200px]"
                                on:change={() => void on_organization_change()}
                                >{#each organizations as organization}<option
                                        value={organization.id}
                                        >{organization.name}</option
                                    >{/each}</select
                            >{:else}<span
                                class="text-sm font-medium text-accent-700 dark:text-accent-300 px-3 py-2 bg-accent-100 dark:bg-accent-800 rounded-lg"
                                >{selected_organization_name}</span
                            >{/if}{#if can_user_add_activities}<button
                                type="button"
                                class="btn btn-primary-action whitespace-nowrap"
                                on:click={on_open_create_modal}
                                >+ Add Activity</button
                            >{/if}<button
                            type="button"
                            class="px-4 py-2 text-sm font-medium rounded-lg border-2 border-primary-500 dark:border-primary-400 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 whitespace-nowrap flex items-center gap-2 transition-colors shadow-sm"
                            on:click={on_open_subscribe_modal}
                            ><svg
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
                <div
                    class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
                >
                    <span
                        class="text-sm font-medium text-accent-700 dark:text-accent-300"
                        >Filters:</span
                    ><select
                        bind:value={filter_category_id}
                        disabled={filter_loading}
                        class="select-styled w-full sm:w-auto disabled:opacity-50"
                        on:change={() => void on_filter_change()}
                        ><option value="">All Categories</option
                        >{#each categories as category}<option
                                value={category.id}>{category.name}</option
                            >{/each}</select
                    ><select
                        bind:value={filter_competition_id}
                        disabled={filter_loading}
                        class="select-styled w-full sm:w-auto disabled:opacity-50"
                        on:change={() => void on_filter_change()}
                        ><option value="">All Competitions</option
                        >{#each competitions as competition}<option
                                value={competition.id}
                                >{competition.name}</option
                            >{/each}</select
                    ><select
                        bind:value={filter_team_id}
                        disabled={filter_loading}
                        class="select-styled w-full sm:w-auto disabled:opacity-50"
                        on:change={() => void on_filter_change()}
                        ><option value="">All Teams</option
                        >{#each teams as team}<option value={team.id}
                                >{team.name}</option
                            >{/each}</select
                    >{#if filter_category_id || filter_competition_id || filter_team_id}<button
                            type="button"
                            disabled={filter_loading}
                            class="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                            on:click={() => void on_clear_filters()}
                            >Clear Filters</button
                        >{/if}{#if filter_loading}<div
                            class="flex items-center gap-2 text-sm text-accent-500"
                        >
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
                        </div>{/if}<button
                        type="button"
                        class="ml-auto text-sm text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100"
                        on:click={on_open_category_modal}>+ New Category</button
                    >
                </div>
                <div class="flex flex-wrap gap-2 pb-2">
                    {#each categories as category}<span
                            class="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full"
                            style={`background-color: ${category.color}20; color: ${category.color};`}
                            ><span
                                class="w-2 h-2 rounded-full"
                                style={`background-color: ${category.color};`}
                            ></span>{category.name}</span
                        >{/each}
                </div>
                <CalendarScheduleView
                    {calendar_events}
                    {categories}
                    {on_event_click}
                    {on_date_click}
                    {on_date_time_click}
                />
            </div>
        {/if}
    </LoadingStateWrapper>
</div>
