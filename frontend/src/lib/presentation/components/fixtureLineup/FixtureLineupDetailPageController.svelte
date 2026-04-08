<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
    import type { Team } from "$lib/core/entities/Team";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { create_fixture_lineup_detail_page_controller_runtime } from "$lib/presentation/logic/fixtureLineupDetailPageControllerRuntime";
    import { build_fixture_lineup_selected_player_ids } from "$lib/presentation/logic/fixtureLineupDetailPageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import FixtureLineupDetailPageContent from "./FixtureLineupDetailPageContent.svelte";

    const FIXTURE_LINEUP_DETAIL_PAGE_TEXT = {
        PAGE_TITLE: "Lineup Details - Sport-Sync",
        ACCESS_DENIED:
            "Access denied: Your role does not have permission to view fixture lineups. Please contact your organization administrator if you believe this is an error.",
        ACCESS_CHECK_FAILED: "Failed to verify lineup access",
        UPDATE_FAILED: "Failed to update lineup",
        SUBMIT_FAILED: "Failed to submit lineup",
        SUBMIT_CONFIRMATION:
            "Submit this lineup? You won't be able to edit it after submission.",
        LINEUP_LIST_PATH: "/fixture-lineups",
        READ_ACTION: "read",
        UPDATE_ACTION: "update",
        ENTITY_TYPE: "fixturelineup",
    } as const;

    export let lineup_id: string;

    const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
    const fixture_use_cases = get_fixture_use_cases();
    const team_use_cases = get_team_use_cases();
    const player_use_cases = get_player_use_cases();
    const membership_use_cases = get_player_team_membership_use_cases();
    const player_position_use_cases = get_player_position_use_cases();

    let lineup: FixtureLineup | null = null,
        fixture: Fixture | null = null,
        team: Team | null = null,
        team_players: TeamPlayer[] = [],
        home_team: Team | null = null,
        away_team: Team | null = null,
        loading = true,
        saving = false,
        error_message = "",
        can_modify_lineup = false,
        permission_info_message = "";
    $: selected_player_ids = build_fixture_lineup_selected_player_ids(lineup);
    const runtime = create_fixture_lineup_detail_page_controller_runtime({
        access_denied_message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_DENIED,
        access_denial_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        access_check_failed_message:
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
        entity_type: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ENTITY_TYPE,
        get_auth_state: () => get(auth_store),
        get_lineup: () => lineup,
        get_team_players: () => team_players,
        goto,
        is_browser: browser,
        lineup_id,
        lineup_list_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        read_action: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.READ_ACTION,
        set_access_denial: (path: string, message: string) =>
            access_denial_store.set_denial(path, message),
        set_away_team: (value: Team | null) => (away_team = value),
        set_can_modify_lineup: (value: boolean) => (can_modify_lineup = value),
        set_error_message: (value: string) => (error_message = value),
        set_fixture: (value: Fixture | null) => (fixture = value),
        set_home_team: (value: Team | null) => (home_team = value),
        set_lineup: (value: FixtureLineup | null) => (lineup = value),
        set_loading: (value: boolean) => (loading = value),
        set_permission_info_message: (value: string) =>
            (permission_info_message = value),
        set_saving: (value: boolean) => (saving = value),
        set_team: (value: Team | null) => (team = value),
        set_team_players: (value: TeamPlayer[]) => (team_players = value),
        submit_confirmation:
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_CONFIRMATION,
        submit_failed_message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_FAILED,
        update_action: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_ACTION,
        update_failed_message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_FAILED,
        use_cases: {
            fixture_lineup_use_cases,
            fixture_use_cases,
            membership_use_cases,
            player_position_use_cases,
            player_use_cases,
            team_use_cases,
        },
    });

    onMount(() => void runtime.initialize_page());
</script>

<svelte:head>
    <title>{FIXTURE_LINEUP_DETAIL_PAGE_TEXT.PAGE_TITLE}</title>
</svelte:head>

<FixtureLineupDetailPageContent
    {loading}
    {error_message}
    {lineup}
    {fixture}
    {team}
    {team_players}
    {home_team}
    {away_team}
    {can_modify_lineup}
    {permission_info_message}
    selected_player_ids={[...selected_player_ids]}
    {saving}
    on_toggle_player_selection={runtime.handle_toggle_player_selection}
    on_back={() => void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH)}
    on_save={runtime.handle_save}
    on_submit={runtime.handle_submit}
/>
