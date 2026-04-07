<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import {
        get_fixture_lineup_by_id,
        submit_lineup,
    } from "$lib/adapters/persistence/fixtureLineupService";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
    import type { Team } from "$lib/core/entities/Team";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        authorize_fixture_lineup_detail_page,
        save_fixture_lineup_changes,
        submit_fixture_lineup_changes,
    } from "$lib/presentation/logic/fixtureLineupDetailPageActions";
    import { load_fixture_lineup_detail_view_data } from "$lib/presentation/logic/fixtureLineupDetailPageData";
    import {
        build_fixture_lineup_selected_player_ids,
        toggle_fixture_lineup_player_selection,
    } from "$lib/presentation/logic/fixtureLineupDetailPageState";
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

    let lineup: FixtureLineup | null = null;
    let fixture: Fixture | null = null;
    let team: Team | null = null;
    let team_players: TeamPlayer[] = [];
    let home_team: Team | null = null;
    let away_team: Team | null = null;
    let loading = true;
    let saving = false;
    let error_message = "";
    let can_modify_lineup = false;
    let permission_info_message = "";
    $: selected_player_ids = build_fixture_lineup_selected_player_ids(lineup);
    async function load_lineup(): Promise<void> {
        loading = true;
        error_message = "";
        const result = await load_fixture_lineup_detail_view_data(
            lineup_id,
            get(auth_store).current_profile,
            {
                get_fixture_lineup_by_id,
                get_fixture_by_id: fixture_use_cases.get_by_id,
                get_team_by_id: team_use_cases.get_by_id,
                list_players_by_team: player_use_cases.list_players_by_team,
                list_memberships_by_team:
                    membership_use_cases.list_memberships_by_team,
                list_positions: player_position_use_cases.list,
            },
        );
        if (!result.success) {
            error_message = result.error_message;
            loading = false;
            return;
        }
        lineup = result.data.lineup;
        fixture = result.data.fixture;
        team = result.data.team;
        team_players = result.data.team_players;
        home_team = result.data.home_team;
        away_team = result.data.away_team;
        loading = false;
    }
    function handle_toggle_player_selection(player_id: string): void {
        if (!lineup) return;
        lineup = toggle_fixture_lineup_player_selection(
            lineup,
            team_players,
            player_id,
        );
    }
    async function handle_save(): Promise<void> {
        if (!lineup) return;
        saving = true;
        error_message = "";
        const result = await save_fixture_lineup_changes(
            lineup_id,
            lineup,
            fixture_lineup_use_cases.update,
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_FAILED,
        );
        saving = false;
        if (!result.success) {
            error_message = result.error_message;
            return;
        }
        void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH);
    }
    async function handle_submit(): Promise<void> {
        if (
            !lineup ||
            !confirm(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_CONFIRMATION)
        )
            return;
        saving = true;
        const result = await submit_fixture_lineup_changes(
            lineup_id,
            submit_lineup,
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_FAILED,
        );
        saving = false;
        if (!result.success) {
            error_message = result.error_message;
            return;
        }
        void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH);
    }
    function handle_back(): void {
        void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH);
    }
    onMount(async () => {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            loading = false;
            return;
        }
        const auth_state = get(auth_store);
        if (auth_state.current_token) {
            const authorization_adapter = get_authorization_adapter();
            const authorization_result =
                await authorize_fixture_lineup_detail_page(
                    authorization_adapter,
                    auth_state.current_token.raw_token,
                    FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ENTITY_TYPE,
                    FIXTURE_LINEUP_DETAIL_PAGE_TEXT.READ_ACTION,
                    FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_ACTION,
                    FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
                );
            if (!authorization_result.success) {
                error_message = authorization_result.error_message;
                loading = false;
                return;
            }

            if (!authorization_result.is_read_authorized) {
                access_denial_store.set_denial(
                    `${FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH}/${lineup_id}`,
                    FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_DENIED,
                );
                void goto("/");
                return;
            }
            can_modify_lineup = authorization_result.can_modify_lineup;
            permission_info_message =
                authorization_result.permission_info_message;
        }
        await load_lineup();
    });
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
    on_toggle_player_selection={handle_toggle_player_selection}
    on_back={handle_back}
    on_save={handle_save}
    on_submit={handle_submit}
/>
