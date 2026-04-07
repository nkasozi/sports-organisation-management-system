<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import CompetitionResultsTeamFixtureCard from "$lib/presentation/components/competition/CompetitionResultsTeamFixtureCard.svelte";
    import Pagination from "$lib/presentation/components/ui/Pagination.svelte";

    export let selected_team_id: string | null;
    export let selected_team_name: string;
    export let team_fixtures_loading: boolean;
    export let displayed_team_fixtures: Fixture[];
    export let paginated_team_fixtures: Fixture[];
    export let show_all_competitions_fixtures: boolean;
    export let sorted_team_fixtures_length: number;
    export let team_fixtures_page: number;
    export let team_fixtures_total_pages: number;
    export let team_fixtures_per_page: number;
    export let page_size_options: number[];
    export let format_date: (date_string: string) => string;
    export let get_team_name_extended: (team_id: string) => string;
    export let get_competition_name_extended: (
        competition_id: string,
    ) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_close: () => void;
    export let on_open_match_report: (fixture_id: string) => void;
</script>

{#if selected_team_id}
    <div
        class="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
    >
        <div
            class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        on:click={on_close}
                        aria-label="Close"
                    >
                        <svg
                            class="w-5 h-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            /></svg
                        >
                    </button>
                    <div>
                        <h3
                            class="text-base font-semibold text-accent-900 dark:text-accent-100"
                        >
                            {selected_team_name} Fixtures
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            {displayed_team_fixtures.length}
                            {displayed_team_fixtures.length === 1
                                ? "fixture"
                                : "fixtures"}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={show_all_competitions_fixtures}
                            class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                            >All competitions</span
                        >
                    </label>
                </div>
            </div>
        </div>

        <div class="p-4">
            {#if team_fixtures_loading}
                <div class="flex items-center justify-center py-8">
                    <div
                        class="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"
                    ></div>
                </div>
            {:else if displayed_team_fixtures.length === 0}
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No fixtures found for this team.
                </div>
            {:else}
                <div class="space-y-3">
                    {#each paginated_team_fixtures as fixture}
                        <CompetitionResultsTeamFixtureCard
                            {fixture}
                            {selected_team_id}
                            {format_date}
                            {get_team_name_extended}
                            {get_competition_name_extended}
                            {get_team_logo_url}
                            {on_open_match_report}
                        />
                    {/each}
                </div>

                <Pagination
                    current_page={team_fixtures_page}
                    total_pages={team_fixtures_total_pages}
                    total_items={sorted_team_fixtures_length}
                    items_per_page={team_fixtures_per_page}
                    {page_size_options}
                    on:page_change={(event) =>
                        (team_fixtures_page = event.detail.page)}
                    on:page_size_change={(event) => {
                        team_fixtures_per_page = event.detail.size;
                        team_fixtures_page = 1;
                    }}
                />
            {/if}
        </div>
    </div>
{/if}
