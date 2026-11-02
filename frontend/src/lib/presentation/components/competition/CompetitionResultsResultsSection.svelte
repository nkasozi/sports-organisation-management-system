<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import CompetitionResultsResultCard from "$lib/presentation/components/competition/CompetitionResultsResultCard.svelte";
    import Pagination from "$lib/presentation/components/ui/Pagination.svelte";
    import {
        build_competition_bracket,
        is_bracket_stage_type,
    } from "$lib/presentation/logic/competitionBracket";
    import {
        build_completed_results_page,
        filter_completed_results,
    } from "$lib/presentation/logic/competitionResultsSearch";
    import {
        RESULTS_VIEW_MODE,
        RESULTS_VIEW_SURFACE,
        type ResultsViewMode,
    } from "$lib/presentation/logic/competitionResultsViewMode";
    import type { CompetitionStageResultsSection } from "$lib/presentation/logic/competitionStageResults";

    import CompetitionBracket from "./CompetitionBracket.svelte";
    import {
        COMPLETED_RESULTS_TEXT,
        describe_completed_results_count,
    } from "./competitionResultsDisplayConstants";
    import DownloadAllReportsButton from "./DownloadAllReportsButton.svelte";
    import ResultsViewModeToggle from "./ResultsViewModeToggle.svelte";

    export let completed_fixtures: Fixture[];
    export let stage_results_sections: CompetitionStageResultsSection[];
    export let results_page: number;
    export let results_per_page: number;
    export let page_size_options: number[];
    export let downloading_all_reports: boolean;
    export let downloading_fixture_id: string;
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id: string) => string;
    export let get_fixture_stage_type: (stage_id: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
    export let on_download_all_reports: () => Promise<boolean>;
    export let on_download_match_report: (
        fixture: Fixture,
        event: MouseEvent,
    ) => Promise<boolean>;

    let search_query = "";
    let view_mode: ResultsViewMode = RESULTS_VIEW_MODE.LIST;

    $: matching_fixtures = filter_completed_results({
        fixtures: completed_fixtures,
        search_query,
        get_team_name,
        get_stage_name: get_fixture_stage_name,
        get_stage_type: get_fixture_stage_type,
        format_date,
    });
    $: results_page_view = build_completed_results_page({
        fixtures: matching_fixtures,
        page_number: results_page,
        items_per_page: results_per_page,
    });
    $: has_bracket_stages = stage_results_sections.some((section) =>
        is_bracket_stage_type(section.stage.stage_type),
    );
    $: is_bracket_view =
        has_bracket_stages && view_mode === RESULTS_VIEW_MODE.BRACKET;
    $: bracket_rounds = is_bracket_view
        ? build_competition_bracket({
              stages: stage_results_sections.map((section) => section.stage),
              fixtures: matching_fixtures,
          })
        : [];

    function update_search_query(next_search_query: string): string {
        search_query = next_search_query;
        results_page = 1;
        return search_query;
    }
</script>

{#if completed_fixtures.length === 0}
    <div class="text-center py-8 text-accent-500">
        {COMPLETED_RESULTS_TEXT.NO_COMPLETED_FIXTURES}
    </div>
{:else}
    <div
        class="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between"
    >
        <span class="text-sm text-gray-500 dark:text-gray-400 shrink-0"
            >{describe_completed_results_count(
                matching_fixtures.length,
                completed_fixtures.length,
            )}</span
        >
        <div class="flex flex-wrap items-center gap-2">
            <input
                type="search"
                class="w-full sm:w-72 h-8 text-sm rounded-[0.175rem] border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 px-3 focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                placeholder={COMPLETED_RESULTS_TEXT.SEARCH_PLACEHOLDER}
                aria-label={COMPLETED_RESULTS_TEXT.SEARCH_LABEL}
                value={search_query}
                on:input={(event) =>
                    update_search_query(event.currentTarget.value)}
            />
            {#if has_bracket_stages}
                <ResultsViewModeToggle
                    surface={RESULTS_VIEW_SURFACE.RESULTS}
                    bind:view_mode
                />
            {/if}
            <DownloadAllReportsButton
                {downloading_all_reports}
                {on_download_all_reports}
            />
        </div>
    </div>
    {#if matching_fixtures.length === 0}
        <div class="text-center py-8 text-accent-500 space-y-3">
            <p>{COMPLETED_RESULTS_TEXT.NO_MATCHING_RESULTS}</p>
            <button
                type="button"
                class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                on:click={() => update_search_query("")}
                >{COMPLETED_RESULTS_TEXT.CLEAR_SEARCH}</button
            >
        </div>
    {:else if is_bracket_view}
        <CompetitionBracket
            rounds={bracket_rounds}
            {get_team_name}
            {get_team_logo_url}
            {on_open_match_report}
        />
    {:else}
        <div class="space-y-3">
            {#each results_page_view.page_fixtures as fixture (fixture.id)}
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
            total_pages={results_page_view.total_pages}
            total_items={matching_fixtures.length}
            items_per_page={results_per_page}
            {page_size_options}
            on:page_change={(event) => (results_page = event.detail.page)}
            on:page_size_change={(event) => {
                results_per_page = event.detail.size;
                results_page = 1;
            }}
        />
    {/if}
{/if}
