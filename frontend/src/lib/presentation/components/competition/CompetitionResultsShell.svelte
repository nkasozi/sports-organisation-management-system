<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { CompetitionResultsCompetitionFormatState } from "$lib/presentation/logic/competitionResultsPageContracts";
    import type {
        CardSortMode,
        PlayerStats,
    } from "$lib/presentation/logic/competitionResultsStats";
    import type {
        CompetitionStageResultsSection,
        TeamStanding,
    } from "$lib/presentation/logic/competitionStageResults";

    import CompetitionResultsFixturesSection from "./CompetitionResultsFixturesSection.svelte";
    import CompetitionResultsHeader from "./CompetitionResultsHeader.svelte";
    import CompetitionResultsResultsSection from "./CompetitionResultsResultsSection.svelte";
    import CompetitionResultsStandingsSection from "./CompetitionResultsStandingsSection.svelte";
    import CompetitionResultsStatsSection from "./CompetitionResultsStatsSection.svelte";
    import CompetitionResultsTabs from "./CompetitionResultsTabs.svelte";
    import CompetitionResultsTeamFixturesPanel from "./CompetitionResultsTeamFixturesPanel.svelte";

    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let competitions: Competition[];
    export let selected_competition_id: string;
    export let competition_format_state: CompetitionResultsCompetitionFormatState = {
        status: "missing",
    };
    export let can_change_organizations: boolean;
    export let share_link_copied: boolean;
    export let active_tab: "standings" | "fixtures" | "results" | "stats";
    export let fixtures_loading: boolean;
    export let standings: TeamStanding[];
    export let stage_results_sections: CompetitionStageResultsSection[];
    export let selected_team_id: string;
    export let live_team_ids: Set<string>;
    export let upcoming_fixtures: Fixture[];
    export let paginated_upcoming: Fixture[];
    export let upcoming_page: number;
    export let upcoming_total_pages: number;
    export let upcoming_per_page: number;
    export let completed_fixtures: Fixture[];
    export let paginated_completed: Fixture[];
    export let results_page: number;
    export let results_total_pages: number;
    export let results_per_page: number;
    export let page_size_options: number[];
    export let downloading_all_reports: boolean;
    export let downloading_fixture_id: string;
    export let stats_team_filter: string;
    export let stats_available_teams: string[];
    export let stats_card_sort: CardSortMode;
    export let stats_filtered_scorers: PlayerStats[];
    export let stats_filtered_card_players: PlayerStats[];
    export let selected_team_name: string;
    export let team_fixtures_loading: boolean;
    export let displayed_team_fixtures: Fixture[];
    export let paginated_team_fixtures: Fixture[];
    export let show_all_competitions_fixtures: boolean;
    export let sorted_team_fixtures_length: number;
    export let team_fixtures_page: number;
    export let team_fixtures_total_pages: number;
    export let team_fixtures_per_page: number;
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id: string) => string;
    export let get_fixture_stage_type: (stage_id: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_name_extended: (team_id: string) => string;
    export let get_competition_name_extended: (
        competition_id: string,
    ) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_organization_change: () => Promise<void>;
    export let on_competition_change: () => void;
    export let on_copy_share_link: () => boolean;
    export let on_team_click: (
        event: CustomEvent<{ team_id: string; team_name: string }>,
    ) => void;
    export let on_open_match_report: (fixture_id: string) => void;
    export let on_download_all_reports: () => Promise<boolean>;
    export let on_download_match_report: (
        fixture: Fixture,
        event: MouseEvent,
    ) => Promise<boolean>;
    export let on_close_team_fixtures_panel: () => void;
</script>

<div
    class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 px-4 pt-4 pb-6 space-y-6 sm:mx-0 sm:px-6 sm:border sm:rounded-lg overflow-hidden"
>
    <CompetitionResultsHeader
        {organizations}
        bind:selected_organization_id
        bind:selected_competition_id
        {competitions}
        selected_competition_format_name={competition_format_state.status === "present"
            ? competition_format_state.competition_format.name
            : ""}
        {can_change_organizations}
        {share_link_copied}
        {on_organization_change}
        {on_competition_change}
        {on_copy_share_link}
    />
    <CompetitionResultsTabs
        bind:active_tab
        upcoming_count={upcoming_fixtures.length}
        results_count={completed_fixtures.length}
    />

    <div class="min-h-[200px]">
        {#if fixtures_loading}
            <div class="flex items-center justify-center py-12">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
                ></div>
            </div>
        {:else if active_tab === "standings"}
            <CompetitionResultsStandingsSection
                {standings}
                {stage_results_sections}
                {selected_team_id}
                {live_team_ids}
                {format_date}
                {get_team_name}
                {get_team_logo_url}
                {on_team_click}
                {on_open_match_report}
            />
            <CompetitionResultsTeamFixturesPanel
                {selected_team_id}
                {selected_team_name}
                {team_fixtures_loading}
                {displayed_team_fixtures}
                {paginated_team_fixtures}
                bind:show_all_competitions_fixtures
                {sorted_team_fixtures_length}
                bind:team_fixtures_page
                {team_fixtures_total_pages}
                bind:team_fixtures_per_page
                {page_size_options}
                {format_date}
                {get_team_name_extended}
                {get_competition_name_extended}
                {get_team_logo_url}
                on_close={on_close_team_fixtures_panel}
                {on_open_match_report}
            />
        {:else if active_tab === "fixtures"}
            <CompetitionResultsFixturesSection
                {upcoming_fixtures}
                {paginated_upcoming}
                bind:upcoming_page
                {upcoming_total_pages}
                bind:upcoming_per_page
                {page_size_options}
                {format_date}
                {get_fixture_stage_name}
                {get_fixture_stage_type}
                {get_team_name}
                {get_team_logo_url}
                {on_open_match_report}
            />
        {:else if active_tab === "results"}
            <CompetitionResultsResultsSection
                {completed_fixtures}
                {paginated_completed}
                bind:results_page
                {results_total_pages}
                bind:results_per_page
                {page_size_options}
                {downloading_all_reports}
                {downloading_fixture_id}
                {format_date}
                {get_fixture_stage_name}
                {get_fixture_stage_type}
                {get_team_name}
                {get_team_logo_url}
                {on_open_match_report}
                {on_download_all_reports}
                {on_download_match_report}
            />
        {:else}
            <CompetitionResultsStatsSection
                bind:stats_team_filter
                {stats_available_teams}
                bind:stats_card_sort
                {stats_filtered_scorers}
                {stats_filtered_card_players}
            />
        {/if}
    </div>
</div>
