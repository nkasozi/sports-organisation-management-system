<script lang="ts">
    import { goto } from "$app/navigation";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import {
        get_competition_use_cases,
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_official_use_cases,
        get_organization_use_cases,
        get_team_staff_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import {
        type CompetitionResultsMatchReportDependencies,
        download_all_fixture_reports,
        download_fixture_report,
    } from "$lib/presentation/logic/competitionResultsMatchReports";
    import { build_shareable_competition_results_url } from "$lib/presentation/logic/competitionResultsPageData";
    import { type CardSortMode } from "$lib/presentation/logic/competitionResultsStats";
    import { load_team_fixtures_bundle } from "$lib/presentation/logic/competitionResultsTeamFixturesData";
    import {
        competition_results_page_size_options,
        format_competition_results_date,
        get_competition_results_extended_competition_name,
        get_competition_results_extended_team_name,
        get_competition_results_stage_name,
        get_competition_results_stage_type,
        get_competition_results_team_logo_url,
        get_competition_results_team_name,
    } from "$lib/presentation/logic/competitionResultsWorkspaceDisplay";
    import { derive_competition_results_workspace_state } from "$lib/presentation/logic/competitionResultsWorkspaceState";
    import { branding_store } from "$lib/presentation/stores/branding";

    import CompetitionResultsShell from "./CompetitionResultsShell.svelte";

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

    const fixture_use_cases = get_fixture_use_cases();
    const team_use_cases = get_team_use_cases();
    const competition_use_cases = get_competition_use_cases();
    const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
    const official_use_cases = get_official_use_cases();
    const organization_use_cases = get_organization_use_cases();
    const team_staff_use_cases = get_team_staff_use_cases();
    const match_report_dependencies: CompetitionResultsMatchReportDependencies =
        {
            fixture_lineup_use_cases,
            official_use_cases,
            organization_use_cases,
            team_staff_use_cases,
        };

    let active_tab: "standings" | "fixtures" | "results" | "stats" =
        "standings";
    let upcoming_page = 1;
    let upcoming_per_page = 10;
    let results_page = 1;
    let results_per_page = 10;
    let stats_team_filter = "all";
    let stats_card_sort: CardSortMode = "total";
    let share_link_copied = false;
    let downloading_fixture_id: string | null = null;
    let downloading_all_reports = false;
    let selected_team_id: string | null = null;
    let selected_team_name = "";
    let team_fixtures_loading = false;
    let team_fixtures_in_competition: Fixture[] = [];
    let team_fixtures_all_competitions: Fixture[] = [];
    let show_all_competitions_fixtures = false;
    let extended_team_map: Map<string, Team> = new Map();
    let extended_competition_map: Map<string, Competition> = new Map();
    let team_fixtures_page = 1;
    let team_fixtures_per_page = 10;

    $: workspace_state = derive_competition_results_workspace_state({
        competition_format,
        selected_competition,
        competition_stages,
        fixtures,
        teams,
        team_map,
        upcoming_page,
        upcoming_per_page,
        results_page,
        results_per_page,
        stats_team_filter,
        stats_card_sort,
        team_fixtures_in_competition,
        team_fixtures_all_competitions,
        show_all_competitions_fixtures,
        team_fixtures_page,
        team_fixtures_per_page,
    });
    $: team_fixtures_reset_key = `${show_all_competitions_fixtures}:${team_fixtures_in_competition.length}:${team_fixtures_all_competitions.length}`;
    $: if (active_tab) {
        upcoming_page = 1;
        results_page = 1;
    }
    $: if (team_fixtures_reset_key) team_fixtures_page = 1;

    const get_fixture_stage_name = (stage_id?: string | null): string =>
        get_competition_results_stage_name(
            stage_id,
            competition_stages,
            workspace_state.competition_stage_map,
        );
    const get_fixture_stage_type = (stage_id?: string | null): string =>
        get_competition_results_stage_type(
            stage_id,
            workspace_state.competition_stage_map,
        );
    const get_team_name = (team_id: string): string =>
        get_competition_results_team_name(team_id, team_map);
    const get_team_name_extended = (team_id: string): string =>
        get_competition_results_extended_team_name(
            team_id,
            extended_team_map,
            team_map,
        );
    const get_competition_name_extended = (competition_id: string): string =>
        get_competition_results_extended_competition_name(
            competition_id,
            extended_competition_map,
        );
    const get_team_logo_url = (team_id: string): string =>
        get_competition_results_team_logo_url(
            team_id,
            team_map,
            extended_team_map,
        );

    async function handle_team_click(
        event: CustomEvent<{ team_id: string; team_name: string }>,
    ): Promise<void> {
        if (selected_team_id === event.detail.team_id) {
            close_team_fixtures_panel();
            return;
        }
        selected_team_id = event.detail.team_id;
        selected_team_name = event.detail.team_name;
        team_fixtures_loading = true;
        const bundle = await load_team_fixtures_bundle({
            team_id: event.detail.team_id,
            fixtures,
            team_map,
            competitions,
            dependencies: {
                fixture_use_cases,
                team_use_cases,
                competition_use_cases,
            },
        });
        team_fixtures_in_competition = bundle.team_fixtures_in_competition;
        team_fixtures_all_competitions = bundle.team_fixtures_all_competitions;
        extended_team_map = bundle.extended_team_map;
        extended_competition_map = bundle.extended_competition_map;
        team_fixtures_loading = false;
    }

    function close_team_fixtures_panel(): void {
        selected_team_id = null;
        selected_team_name = "";
        team_fixtures_in_competition = [];
        team_fixtures_all_competitions = [];
        show_all_competitions_fixtures = false;
    }

    function handle_copy_share_link(): boolean {
        if (
            !selected_organization_id ||
            !selected_competition_id ||
            typeof window === "undefined"
        )
            return false;
        navigator.clipboard.writeText(
            build_shareable_competition_results_url(
                window.location.origin,
                selected_organization_id,
                selected_competition_id,
            ),
        );
        share_link_copied = true;
        setTimeout(() => {
            share_link_copied = false;
        }, 2000);
        return true;
    }

    function open_match_report(fixture_id: string): void {
        goto(`/match-report/${fixture_id}`);
    }

    async function handle_download_match_report(
        fixture: Fixture,
        event: MouseEvent,
    ): Promise<boolean> {
        event.stopPropagation();
        downloading_fixture_id = fixture.id;
        const result = await download_fixture_report({
            fixture,
            selected_competition,
            team_map,
            organization_logo_url: $branding_store.organization_logo_url,
            dependencies: match_report_dependencies,
        });
        downloading_fixture_id = null;
        return result;
    }

    async function handle_download_all_reports(): Promise<boolean> {
        downloading_all_reports = true;
        const result = await download_all_fixture_reports({
            completed_fixtures: workspace_state.completed_fixtures,
            selected_competition,
            team_map,
            organization_logo_url: $branding_store.organization_logo_url,
            dependencies: match_report_dependencies,
        });
        downloading_all_reports = false;
        return result;
    }
</script>

<CompetitionResultsShell
    {organizations}
    bind:selected_organization_id
    {competitions}
    bind:selected_competition_id
    {competition_format}
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
    page_size_options={competition_results_page_size_options}
    {downloading_all_reports}
    {downloading_fixture_id}
    bind:stats_team_filter
    stats_available_teams={workspace_state.stats_available_teams}
    bind:stats_card_sort
    stats_filtered_scorers={workspace_state.stats_filtered_scorers}
    stats_filtered_card_players={workspace_state.stats_filtered_card_players}
    {selected_team_name}
    {team_fixtures_loading}
    displayed_team_fixtures={workspace_state.displayed_team_fixtures}
    paginated_team_fixtures={workspace_state.paginated_team_fixtures}
    bind:show_all_competitions_fixtures
    sorted_team_fixtures_length={workspace_state.sorted_team_fixtures.length}
    bind:team_fixtures_page
    team_fixtures_total_pages={workspace_state.team_fixtures_total_pages}
    bind:team_fixtures_per_page
    format_date={format_competition_results_date}
    {get_fixture_stage_name}
    {get_fixture_stage_type}
    {get_team_name}
    {get_team_name_extended}
    {get_competition_name_extended}
    {get_team_logo_url}
    {on_organization_change}
    {on_competition_change}
    on_copy_share_link={handle_copy_share_link}
    on_team_click={handle_team_click}
    on_open_match_report={open_match_report}
    on_download_all_reports={handle_download_all_reports}
    on_download_match_report={handle_download_match_report}
    on_close_team_fixtures_panel={close_team_fixtures_panel}
/>
