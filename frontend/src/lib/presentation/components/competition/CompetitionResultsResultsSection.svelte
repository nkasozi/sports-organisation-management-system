<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import CompetitionResultsResultCard from "$lib/presentation/components/competition/CompetitionResultsResultCard.svelte";
    import Pagination from "$lib/presentation/components/ui/Pagination.svelte";

    export let completed_fixtures: Fixture[];
    export let paginated_completed: Fixture[];
    export let results_page: number;
    export let results_total_pages: number;
    export let results_per_page: number;
    export let page_size_options: number[];
    export let downloading_all_reports: boolean;
    export let downloading_fixture_id: string | null;
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id?: string | null) => string;
    export let get_fixture_stage_type: (stage_id?: string | null) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
    export let on_download_all_reports: () => Promise<boolean>;
    export let on_download_match_report: (
        fixture: Fixture,
        event: MouseEvent,
    ) => Promise<boolean>;
</script>

{#if completed_fixtures.length === 0}
    <div class="text-center py-8 text-accent-500">
        No completed fixtures yet.
    </div>
{:else}
    <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-gray-500 dark:text-gray-400"
            >{completed_fixtures.length} completed {completed_fixtures.length ===
            1
                ? "match"
                : "matches"}</span
        >
        <button
            type="button"
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50"
            disabled={downloading_all_reports}
            on:click={() => void on_download_all_reports()}
        >
            {#if downloading_all_reports}
                <svg
                    class="w-4 h-4 animate-spin"
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
                >
                Generating All...
            {:else}
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    /></svg
                >
                Download All Reports
            {/if}
        </button>
    </div>
    <div class="space-y-3">
        {#each paginated_completed as fixture}
            <CompetitionResultsResultCard
                {fixture}
                {downloading_fixture_id}
                {format_date}
                {get_fixture_stage_name}
                {get_fixture_stage_type}
                {get_team_name}
                {get_team_logo_url}
                {on_open_match_report}
                {on_download_match_report}
            />
        {/each}
    </div>

    <Pagination
        current_page={results_page}
        total_pages={results_total_pages}
        total_items={completed_fixtures.length}
        items_per_page={results_per_page}
        {page_size_options}
        on:page_change={(event) => (results_page = event.detail.page)}
        on:page_size_change={(event) => {
            results_per_page = event.detail.size;
            results_page = 1;
        }}
    />
{/if}
