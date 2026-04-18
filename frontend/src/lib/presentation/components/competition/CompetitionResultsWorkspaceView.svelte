<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { CompetitionResultsCompetitionFormatState } from "$lib/presentation/logic/competitionResultsPageContracts";
    import type {
        CardSortMode,
        PlayerStats,
    } from "$lib/presentation/logic/competitionResultsStats";
    import { derive_competition_results_workspace_state } from "$lib/presentation/logic/competitionResultsWorkspaceState";

    import CompetitionResultsShell from "./CompetitionResultsShell.svelte";

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
    export let workspace_state: ReturnType<
        typeof derive_competition_results_workspace_state
    >;
    export let selected_team_id: string;
    export let downloading_all_reports: boolean;
    export let downloading_fixture_id: string;
    export let stats_team_filter: string;
    export let stats_card_sort: CardSortMode;
    export let selected_team_name: string;
    export let team_fixtures_loading: boolean;
    export let show_all_competitions_fixtures: boolean;
    export let team_fixtures_page: number;
    export let team_fixtures_per_page: number;
    export let upcoming_page: number;
    export let upcoming_per_page: number;
    export let results_page: number;
    export let results_per_page: number;
    export let page_size_options: number[];
    export let on_organization_change: () => Promise<void>;
    export let on_competition_change: () => void;
    export let on_copy_share_link: () => boolean;
    export let on_team_click: (
        event: CustomEvent<{ team_id: string; team_name: string }>,
    ) => Promise<void>;
    export let on_open_match_report: (fixture_id: string) => void;
    export let on_download_all_reports: () => Promise<boolean>;
    export let on_download_match_report: (
        fixture: Fixture,
        event: MouseEvent,
    ) => Promise<boolean>;
    export let on_close_team_fixtures_panel: () => void;
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id: string) => string;
    export let get_fixture_stage_type: (stage_id: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_name_extended: (team_id: string) => string;
    export let get_competition_name_extended: (
        competition_id: string,
    ) => string;
    export let get_team_logo_url: (team_id: string) => string;
</script>

<CompetitionResultsShell
    {organizations}
    bind:selected_organization_id
    {competitions}
    bind:selected_competition_id
    {competition_format_state}
    {can_change_organizations}
    {share_link_copied}
    bind:active_tab
    {fixtures_loading}
    standings={workspace_state.standings}
    stage_results_sections={workspace_state.stage_results_sections}
    {selected_team_id}
    live_team_ids={workspace_state.live_team_ids}
    upcoming_fixtures={workspace_state.upcoming_fixtures}
    paginated_upcoming={workspace_state.paginated_upcoming}
    bind:upcoming_page
    upcoming_total_pages={workspace_state.upcoming_total_pages}
    bind:upcoming_per_page
    completed_fixtures={workspace_state.completed_fixtures}
    paginated_completed={workspace_state.paginated_completed}
    bind:results_page
    results_total_pages={workspace_state.results_total_pages}
    bind:results_per_page
    {page_size_options}
    {downloading_all_reports}
    {downloading_fixture_id}
    bind:stats_team_filter
    stats_available_teams={workspace_state.stats_available_teams}
    bind:stats_card_sort
    stats_filtered_scorers={workspace_state.stats_filtered_scorers as PlayerStats[]}
    stats_filtered_card_players={workspace_state.stats_filtered_card_players as PlayerStats[]}
    {selected_team_name}
    {team_fixtures_loading}
    displayed_team_fixtures={workspace_state.displayed_team_fixtures}
    paginated_team_fixtures={workspace_state.paginated_team_fixtures}
    bind:show_all_competitions_fixtures
    sorted_team_fixtures_length={workspace_state.sorted_team_fixtures.length}
    bind:team_fixtures_page
    team_fixtures_total_pages={workspace_state.team_fixtures_total_pages}
    bind:team_fixtures_per_page
    {format_date}
    {get_fixture_stage_name}
    {get_fixture_stage_type}
    {get_team_name}
    {get_team_name_extended}
    {get_competition_name_extended}
    {get_team_logo_url}
    {on_organization_change}
    {on_competition_change}
    {on_copy_share_link}
    {on_team_click}
    {on_open_match_report}
    {on_download_all_reports}
    {on_download_match_report}
    {on_close_team_fixtures_panel}
/>
