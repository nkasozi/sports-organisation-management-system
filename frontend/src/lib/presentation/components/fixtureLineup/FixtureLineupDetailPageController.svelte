<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import type {
        FixtureLineupDetailFixtureState,
        FixtureLineupDetailLineupState,
        FixtureLineupDetailTeamState,
        FixtureLineupDetailTokenState,
    } from "$lib/presentation/logic/fixtureLineupDetailPageContracts";
    import { create_fixture_lineup_detail_page_controller_runtime } from "$lib/presentation/logic/fixtureLineupDetailPageControllerRuntime";
    import { build_fixture_lineup_detail_profile_state } from "$lib/presentation/logic/fixtureLineupDetailPageData";
    import { build_fixture_lineup_selected_player_ids } from "$lib/presentation/logic/fixtureLineupDetailPageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import {
        auth_store,
        type AuthState,
    } from "$lib/presentation/stores/auth";

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

    function create_missing_fixture_lineup_detail_lineup_state(): FixtureLineupDetailLineupState {
        return { status: "missing" };
    }

    function create_missing_fixture_lineup_detail_fixture_state(): FixtureLineupDetailFixtureState {
        return { status: "missing" };
    }

    function create_missing_fixture_lineup_detail_team_state(): FixtureLineupDetailTeamState {
        return { status: "missing" };
    }

    function build_fixture_lineup_detail_token_state(
        current_token: AuthState["current_token"],
    ): FixtureLineupDetailTokenState {
        if (current_token.status !== "present") {
            return { status: "missing" };
        }

        return { status: "present", raw_token: current_token.token.raw_token };
    }

    function build_fixture_lineup_detail_current_profile_state(
        current_profile: AuthState["current_profile"],
    ) {
        if (current_profile.status !== "present") {
            return { status: "missing" as const };
        }

        return {
            status: "present" as const,
            profile: {
                organization_id: current_profile.profile.organization_id,
            },
        };
    }

    let lineup_state: FixtureLineupDetailLineupState = create_missing_fixture_lineup_detail_lineup_state(),
        fixture_state: FixtureLineupDetailFixtureState = create_missing_fixture_lineup_detail_fixture_state(),
        team_state: FixtureLineupDetailTeamState = create_missing_fixture_lineup_detail_team_state(),
        team_players: TeamPlayer[] = [],
        home_team_state: FixtureLineupDetailTeamState = create_missing_fixture_lineup_detail_team_state(),
        away_team_state: FixtureLineupDetailTeamState = create_missing_fixture_lineup_detail_team_state(),
        loading = true,
        saving = false,
        error_message = "",
        can_modify_lineup = false,
        permission_info_message = "";
    $: selected_player_ids = build_fixture_lineup_selected_player_ids(lineup_state);
    const runtime = create_fixture_lineup_detail_page_controller_runtime({
        access_denied_message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_DENIED,
        access_denial_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        access_check_failed_message:
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
        entity_type: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ENTITY_TYPE,
        get_auth_state: () => {
            const auth_state = get(auth_store);

            return {
                current_profile_state: build_fixture_lineup_detail_profile_state(
                    build_fixture_lineup_detail_current_profile_state(
                        auth_state.current_profile,
                    ),
                ),
                current_token_state: build_fixture_lineup_detail_token_state(
                    auth_state.current_token,
                ),
            };
        },
        get_lineup_state: () => lineup_state,
        get_team_players: () => team_players,
        goto,
        is_browser: browser,
        lineup_id,
        lineup_list_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        read_action: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.READ_ACTION,
        set_access_denial: (path: string, message: string) =>
            access_denial_store.set_denial(path, message),
        set_away_team_state: (value: FixtureLineupDetailTeamState) => (away_team_state = value),
        set_can_modify_lineup: (value: boolean) => (can_modify_lineup = value),
        set_error_message: (value: string) => (error_message = value),
        set_fixture_state: (value: FixtureLineupDetailFixtureState) => (fixture_state = value),
        set_home_team_state: (value: FixtureLineupDetailTeamState) => (home_team_state = value),
        set_lineup_state: (value: FixtureLineupDetailLineupState) => (lineup_state = value),
        set_loading: (value: boolean) => (loading = value),
        set_permission_info_message: (value: string) =>
            (permission_info_message = value),
        set_saving: (value: boolean) => (saving = value),
        set_team_state: (value: FixtureLineupDetailTeamState) => (team_state = value),
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
    {lineup_state}
    {fixture_state}
    {team_state}
    {team_players}
    {home_team_state}
    {away_team_state}
    {can_modify_lineup}
    {permission_info_message}
    selected_player_ids={[...selected_player_ids]}
    {saving}
    on_toggle_player_selection={runtime.handle_toggle_player_selection}
    on_back={() => void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH)}
    on_save={runtime.handle_save}
    on_submit={runtime.handle_submit}
/>
