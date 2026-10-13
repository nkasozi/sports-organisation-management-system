<script lang="ts">
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type {
        CompetitionResultsCompetitionFormatState,
        CompetitionResultsSelectedCompetitionState,
    } from "$lib/presentation/logic/competitionResultsPageContracts";
    import {
        CARD_SORT_MODE,
        type CardSortMode,
    } from "$lib/presentation/logic/competitionResultsStats";
    import { create_competition_results_workspace_controller_runtime } from "$lib/presentation/logic/competitionResultsWorkspaceControllerRuntime";
    import {
        competition_results_page_size_options,
        format_competition_results_date,
    } from "$lib/presentation/logic/competitionResultsWorkspaceDisplay";
    import { derive_competition_results_workspace_state } from "$lib/presentation/logic/competitionResultsWorkspaceState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { branding_store } from "$lib/presentation/stores/branding";

    import {
        COMPETITION_STATS_ALL_TEAMS_FILTER,
        MATCH_REPORT_PATH_PREFIX,
    } from "./competitionResultsDisplayConstants";
    import { build_competition_results_workspace_lookups } from "./competitionResultsWorkspaceLookups";
    import CompetitionResultsWorkspaceView from "./CompetitionResultsWorkspaceView.svelte";
    import {
        COMPETITION_RESULTS_TAB,
        type CompetitionResultsTab,
    } from "./competitionTabConstants";

    const MISSING_STATE = { status: PRESENCE_STATUS.MISSING } as const;

    export let organizations: Organization[],
        selected_organization_id: string,
        competitions: Competition[],
        selected_competition_id: string,
        selected_competition_state: CompetitionResultsSelectedCompetitionState =
            MISSING_STATE,
        competition_format_state: CompetitionResultsCompetitionFormatState =
            MISSING_STATE,
        competition_stages: CompetitionStage[],
        fixtures: Fixture[],
        teams: Team[],
        team_map: Map<string, Team>,
        fixtures_loading: boolean,
        can_change_organizations: boolean,
        on_organization_change: () => Promise<void>,
        on_competition_change: () => void;

    let active_tab: CompetitionResultsTab = COMPETITION_RESULTS_TAB.STANDINGS,
        upcoming_page = 1,
        upcoming_per_page = 10,
        results_page = 1,
        results_per_page = 10,
        stats_team_filter: string = COMPETITION_STATS_ALL_TEAMS_FILTER,
        stats_card_sort: CardSortMode = CARD_SORT_MODE.TOTAL,
        share_link_copied = false,
        downloading_fixture_id: string = "",
        downloading_all_reports = false,
        selected_team_id: string = "",
        selected_team_name = "",
        team_fixtures_loading = false,
        team_fixtures_in_competition: Fixture[] = [],
        team_fixtures_all_competitions: Fixture[] = [],
        show_all_competitions_fixtures = false,
        extended_team_map: Map<string, Team> = new Map(),
        extended_competition_map: Map<string, Competition> = new Map(),
        team_fixtures_page = 1,
        team_fixtures_per_page = 10;

    $: workspace_state = derive_competition_results_workspace_state({
        competition_format_state,
        selected_competition_state,
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
    $: if (active_tab) upcoming_page = results_page = 1;
    $: if (team_fixtures_reset_key) team_fixtures_page = 1;

    $: lookups = build_competition_results_workspace_lookups({
        competition_stages,
        competition_stage_map: workspace_state.competition_stage_map,
        team_map,
        extended_team_map,
        extended_competition_map,
    });

    const runtime = create_competition_results_workspace_controller_runtime({
        competitions,
        fixtures,
        get_branding_logo_url: () => get(branding_store).organization_logo_url,
        get_completed_fixtures: () => workspace_state.completed_fixtures,
        get_selected_competition_state: () => selected_competition_state,
        get_selected_team_id: () => selected_team_id,
        selected_competition_id,
        selected_organization_id,
        set_downloading_all_reports: (value: boolean) =>
            (downloading_all_reports = value),
        set_downloading_fixture_id: (value: string) =>
            (downloading_fixture_id = value),
        set_extended_competition_map: (value: Map<string, Competition>) =>
            (extended_competition_map = value),
        set_extended_team_map: (value: Map<string, Team>) =>
            (extended_team_map = value),
        set_selected_team_id: (value: string) => (selected_team_id = value),
        set_selected_team_name: (value: string) => (selected_team_name = value),
        set_share_link_copied: (value: boolean) => (share_link_copied = value),
        set_show_all_competitions_fixtures: (value: boolean) =>
            (show_all_competitions_fixtures = value),
        set_team_fixtures_all_competitions: (value: Fixture[]) =>
            (team_fixtures_all_competitions = value),
        set_team_fixtures_in_competition: (value: Fixture[]) =>
            (team_fixtures_in_competition = value),
        set_team_fixtures_loading: (value: boolean) =>
            (team_fixtures_loading = value),
        team_map,
    });
</script>

<CompetitionResultsWorkspaceView
    {organizations}
    bind:selected_organization_id
    {competitions}
    bind:selected_competition_id
    {competition_format_state}
    {can_change_organizations}
    {share_link_copied}
    bind:active_tab
    {fixtures_loading}
    {workspace_state}
    {selected_team_id}
    {downloading_all_reports}
    {downloading_fixture_id}
    bind:stats_team_filter
    bind:stats_card_sort
    {selected_team_name}
    {team_fixtures_loading}
    bind:show_all_competitions_fixtures
    bind:team_fixtures_page
    bind:team_fixtures_per_page
    bind:upcoming_page
    bind:upcoming_per_page
    bind:results_page
    bind:results_per_page
    page_size_options={competition_results_page_size_options}
    {on_organization_change}
    {on_competition_change}
    on_copy_share_link={runtime.handle_copy_share_link}
    on_team_click={runtime.handle_team_click}
    on_open_match_report={(fixture_id) =>
        void goto(`${MATCH_REPORT_PATH_PREFIX}${fixture_id}`)}
    on_download_all_reports={runtime.handle_download_all_reports}
    on_download_match_report={runtime.handle_download_match_report}
    on_close_team_fixtures_panel={runtime.close_team_fixtures_panel}
    format_date={format_competition_results_date}
    {...lookups}
/>
