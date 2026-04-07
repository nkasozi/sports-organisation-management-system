<script lang="ts">
    import { goto } from "$app/navigation";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";

    import CompetitionResultsWorkspace from "./CompetitionResultsWorkspace.svelte";

    export let is_using_cached_data: boolean;
    export let loading_state: LoadingState;
    export let error_message: string;
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let competitions: Competition[];
    export let selected_competition_id: string;
    export let selected_competition: Competition | null;
    export let competition_format: CompetitionFormat | null;
    export let competition_stages: CompetitionStage[];
    export let fixtures: Fixture[];
    export let teams: Team[];
    export let team_map: Map<string, Team>;
    export let fixtures_loading: boolean;
    export let can_change_organizations: boolean;
    export let on_organization_change: () => Promise<void>;
    export let on_competition_change: () => void;
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
            >
            <span
                >Showing locally cached data — connect to the internet to get
                the latest results.</span
            >
        </div>
    {/if}
    <LoadingStateWrapper
        state={loading_state}
        loading_text="Loading data..."
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    /></svg
                >
                <h3
                    class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
                >
                    No organizations found
                </h3>
                <p class="mt-2 text-accent-600 dark:text-accent-400">
                    Create an organization first to view competition results.
                </p>
                <button
                    type="button"
                    class="btn btn-primary-action mt-4"
                    on:click={() => goto("/organizations")}
                    >Go to Organizations</button
                >
            </div>
        {:else if competitions.length === 0}
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
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    /></svg
                >
                <h3
                    class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
                >
                    No competitions found
                </h3>
                <p class="mt-2 text-accent-600 dark:text-accent-400">
                    Create a competition first to see results.
                </p>
                <button
                    type="button"
                    class="btn btn-primary-action mt-4"
                    on:click={() => goto("/competitions/create")}
                    >Create Competition</button
                >
            </div>
        {:else}
            <CompetitionResultsWorkspace
                {organizations}
                bind:selected_organization_id
                {competitions}
                bind:selected_competition_id
                {selected_competition}
                {competition_format}
                {competition_stages}
                {fixtures}
                {teams}
                {team_map}
                {fixtures_loading}
                {can_change_organizations}
                {on_organization_change}
                {on_competition_change}
            />
        {/if}
    </LoadingStateWrapper>
</div>
