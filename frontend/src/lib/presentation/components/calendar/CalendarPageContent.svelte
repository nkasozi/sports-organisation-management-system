<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import CalendarPageControls from "$lib/presentation/components/calendar/CalendarPageControls.svelte";
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
                <CalendarPageControls
                    {organizations}
                    bind:selected_organization_id
                    {selected_organization_name}
                    {teams}
                    {competitions}
                    {categories}
                    bind:filter_category_id
                    bind:filter_competition_id
                    bind:filter_team_id
                    {filter_loading}
                    {can_user_change_organizations}
                    {can_user_add_activities}
                    {on_organization_change}
                    {on_open_create_modal}
                    {on_open_subscribe_modal}
                    {on_filter_change}
                    {on_clear_filters}
                    {on_open_category_modal}
                />
                <CalendarScheduleView
                    {calendar_events}
                    {categories}
                    {can_user_add_activities}
                    {on_event_click}
                    {on_date_click}
                    {on_date_time_click}
                />
            </div>
        {/if}
    </LoadingStateWrapper>
</div>
