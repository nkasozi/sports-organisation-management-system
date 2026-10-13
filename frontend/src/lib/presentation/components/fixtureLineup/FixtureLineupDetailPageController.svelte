<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import { OptionStatus } from "$lib/core/types/Option";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type {
        FixtureLineupDetailFixtureState,
        FixtureLineupDetailLineupState,
        FixtureLineupDetailTeamState,
    } from "$lib/presentation/logic/fixtureLineupDetailPageContracts";
    import { create_fixture_lineup_detail_page_controller_runtime } from "$lib/presentation/logic/fixtureLineupDetailPageControllerRuntime";
    import { build_fixture_lineup_selected_player_ids } from "$lib/presentation/logic/fixtureLineupDetailPageState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import { build_fixture_lineup_detail_auth_snapshot } from "./fixtureLineupDetailAuthSnapshot";
    import {
        FIXTURE_LINEUP_DETAIL_LOG_EVENTS,
        FIXTURE_LINEUP_DETAIL_PAGE_TEXT,
    } from "./fixtureLineupDetailMessages";
    import FixtureLineupDetailPageContent from "./FixtureLineupDetailPageContent.svelte";
    import {
        apply_fixture_lineup_detail_error,
        apply_fixture_lineup_detail_loading_flag,
        apply_fixture_lineup_detail_saving_flag,
        FIXTURE_LINEUP_DETAIL_ACTION,
        FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
        type FixtureLineupDetailAction,
        type FixtureLineupDetailPageStatusState,
        request_fixture_lineup_detail_action,
    } from "./fixtureLineupDetailPageStatus";

    export let lineup_id: string;

    const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
    const fixture_use_cases = get_fixture_use_cases();
    const team_use_cases = get_team_use_cases();
    const player_use_cases = get_player_use_cases();
    const membership_use_cases = get_player_team_membership_use_cases();
    const player_position_use_cases = get_player_position_use_cases();

    const MISSING_STATE = { status: PRESENCE_STATUS.MISSING } as const;

    let lineup_state: FixtureLineupDetailLineupState = MISSING_STATE,
        fixture_state: FixtureLineupDetailFixtureState = MISSING_STATE,
        team_state: FixtureLineupDetailTeamState = MISSING_STATE,
        team_players: TeamPlayer[] = [],
        home_team_state: FixtureLineupDetailTeamState = MISSING_STATE,
        away_team_state: FixtureLineupDetailTeamState = MISSING_STATE,
        page_status_state: FixtureLineupDetailPageStatusState =
            FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
        toast_message = "",
        toast_visible = false,
        can_modify_lineup = false,
        permission_info_message = "";
    function handle_runtime_error(message: string): void {
        const outcome = apply_fixture_lineup_detail_error(
            page_status_state,
            message,
        );
        page_status_state = outcome.state;
        if (!message) return;
        console.error("[FixtureLineupDetail] Lineup operation failed", {
            event:
                outcome.toast_message.status === OptionStatus.SOME
                    ? FIXTURE_LINEUP_DETAIL_LOG_EVENTS.ACTION_FAILED
                    : FIXTURE_LINEUP_DETAIL_LOG_EVENTS.LOAD_FAILED,
            lineup_id,
            error: message,
        });
        if (outcome.toast_message.status === OptionStatus.NONE) return;
        toast_message = outcome.toast_message.value;
        toast_visible = true;
    }

    async function run_lineup_action(
        action: FixtureLineupDetailAction,
        execute: () => Promise<void>,
    ): Promise<void> {
        page_status_state = request_fixture_lineup_detail_action(action);
        await execute();
    }

    $: selected_player_ids =
        build_fixture_lineup_selected_player_ids(lineup_state);
    const runtime = create_fixture_lineup_detail_page_controller_runtime({
        access_denied_message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_DENIED,
        access_denial_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        access_check_failed_message:
            FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
        entity_type: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ENTITY_TYPE,
        get_auth_state: () =>
            build_fixture_lineup_detail_auth_snapshot(get(auth_store)),
        get_lineup_state: () => lineup_state,
        get_team_players: () => team_players,
        goto,
        is_browser: browser,
        lineup_id,
        lineup_list_path: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH,
        read_action: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.READ_ACTION,
        set_access_denial: (path: string, message: string) =>
            access_denial_store.set_denial(path, message),
        set_away_team_state: (value: FixtureLineupDetailTeamState) =>
            (away_team_state = value),
        set_can_modify_lineup: (value: boolean) => (can_modify_lineup = value),
        set_error_message: handle_runtime_error,
        set_fixture_state: (value: FixtureLineupDetailFixtureState) =>
            (fixture_state = value),
        set_home_team_state: (value: FixtureLineupDetailTeamState) =>
            (home_team_state = value),
        set_lineup_state: (value: FixtureLineupDetailLineupState) =>
            (lineup_state = value),
        set_loading: (value: boolean) =>
            (page_status_state = apply_fixture_lineup_detail_loading_flag(
                page_status_state,
                value,
            )),
        set_permission_info_message: (value: string) =>
            (permission_info_message = value),
        set_saving: (value: boolean) =>
            (page_status_state = apply_fixture_lineup_detail_saving_flag(
                page_status_state,
                value,
            )),
        set_team_state: (value: FixtureLineupDetailTeamState) =>
            (team_state = value),
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
    {page_status_state}
    {lineup_state}
    {fixture_state}
    {team_state}
    {team_players}
    {home_team_state}
    {away_team_state}
    {can_modify_lineup}
    {permission_info_message}
    selected_player_ids={[...selected_player_ids]}
    on_toggle_player_selection={runtime.handle_toggle_player_selection}
    on_back={() => void goto(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LINEUP_LIST_PATH)}
    on_save={() =>
        run_lineup_action(
            FIXTURE_LINEUP_DETAIL_ACTION.SAVE,
            runtime.handle_save,
        )}
    on_submit={() =>
        run_lineup_action(
            FIXTURE_LINEUP_DETAIL_ACTION.SUBMIT,
            runtime.handle_submit,
        )}
/>

<Toast
    message={toast_message}
    type="error"
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
