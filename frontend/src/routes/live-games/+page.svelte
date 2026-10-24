<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
    import {
        create_failure_result,
        create_success_result,
    } from "$lib/core/types/Result";
    import LiveGamesPageContent from "$lib/presentation/components/game/LiveGamesPageContent.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { can_user_change_live_games_organization } from "$lib/presentation/logic/liveGamesDataLoader";
    import { live_games_page_dependencies } from "$lib/presentation/logic/liveGamesPageDependencies";
    import { LIVE_GAMES_PAGE_STATUS } from "$lib/presentation/logic/liveGamesPageInitializationTypes";
    import {
        begin_live_games_fixture_refresh,
        create_initializing_live_games_view_state,
        settle_live_games_fixture_load,
    } from "$lib/presentation/logic/liveGamesPageStateMachine";
    import { start_live_game_fixture } from "$lib/presentation/logic/liveGamesStartFlow";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import {
        get_live_games_current_profile_state,
        initialize_live_games_page,
        LIVE_GAMES_PENDING_START_STATUS,
        type LiveGamesPendingStartFixtureState,
        refresh_live_games_page_fixture_state_result,
        update_live_games_checks,
        update_live_games_starting_state,
    } from "../../lib/presentation/logic/liveGamesPageState";
    import {
        build_live_games_route_start_dependencies,
        IDLE_PENDING_START,
        request_live_games_start_confirmation,
        resume_route_start,
    } from "./liveGamesRouteStart";
    import {
        current_live_games_fixture_state,
        derive_live_games_route_view,
        LIVE_GAMES_ROUTE_PATHS,
        type LiveGamesViewState,
    } from "./liveGamesRouteView";

    let organizations: Organization[] = [];
    let selected_organization_id = "",
        action_error_message = "",
        can_start_games = false,
        permission_info_message = "";
    let current_checks: Record<string, PreFlightCheck[]> = {},
        is_starting: Record<string, boolean> = {};
    let view_state: LiveGamesViewState =
        create_initializing_live_games_view_state();
    let pending_start_fixture_state: LiveGamesPendingStartFixtureState =
        IDLE_PENDING_START;

    $: route_view = derive_live_games_route_view(
        view_state,
        action_error_message,
    );

    async function refresh_fixture_state(): Promise<void> {
        if (!selected_organization_id) return;
        action_error_message = "";
        current_checks = {};
        is_starting = {};
        view_state = begin_live_games_fixture_refresh(
            current_live_games_fixture_state(view_state),
        );
        view_state = settle_live_games_fixture_load(
            await refresh_live_games_page_fixture_state_result({
                auth_state: get(auth_store),
                fixture_state_dependencies: live_games_page_dependencies,
                organization_id: selected_organization_id,
            }),
        );
    }

    async function initialize_page(): Promise<void> {
        const result = await initialize_live_games_page({
            ensure_auth_profile,
            auth_state: get(auth_store),
            authorization_adapter:
                live_games_page_dependencies.authorization_adapter,
            organization_use_cases:
                live_games_page_dependencies.organization_use_cases,
            fixture_state_dependencies: live_games_page_dependencies,
            search_parameters: new URL(window.location.href).searchParams,
        });
        switch (result.status) {
            case LIVE_GAMES_PAGE_STATUS.ERROR:
                view_state = settle_live_games_fixture_load(
                    create_failure_result(result.error_message),
                );
                return;
            case LIVE_GAMES_PAGE_STATUS.DENIED:
                access_denial_store.set_denial(
                    LIVE_GAMES_ROUTE_PATHS.LIVE_GAMES,
                    result.denial_reason,
                );
                await goto(LIVE_GAMES_ROUTE_PATHS.HOME);
                return;
            case LIVE_GAMES_PAGE_STATUS.READY:
                organizations = result.organizations;
                selected_organization_id = result.selected_organization_id;
                can_start_games = result.can_start_games;
                permission_info_message = result.permission_info_message;
                view_state = settle_live_games_fixture_load(
                    create_success_result(result.fixture_state),
                );
                resume_route_start(result.fixture_state.fixtures, (fixture) =>
                    handle_start_click(fixture, true),
                );
                return;
        }
    }

    onMount(() => {
        void initialize_page();
    });

    async function handle_organization_change(): Promise<void> {
        pending_start_fixture_state = IDLE_PENDING_START;
        await refresh_fixture_state();
    }

    async function handle_start_click(
        fixture: Fixture,
        is_already_confirmed = false,
    ): Promise<void> {
        const confirmation_result = await request_live_games_start_confirmation(
            fixture,
            get(auth_store),
        );
        if (!confirmation_result.success) {
            action_error_message = confirmation_result.error;
            return;
        }
        pending_start_fixture_state = confirmation_result.data;
        if (is_already_confirmed) confirm_start_fixture();
    }

    function confirm_start_fixture(): void {
        if (
            pending_start_fixture_state.status ===
            LIVE_GAMES_PENDING_START_STATUS.IDLE
        )
            return;
        const fixture = pending_start_fixture_state.fixture;
        pending_start_fixture_state = IDLE_PENDING_START;
        void start_live_game_fixture(
            fixture,
            build_live_games_route_start_dependencies({
                goto,
                get_auth_state: () => get(auth_store),
                set_checks: (fixture_id: string, checks: PreFlightCheck[]) =>
                    (current_checks = update_live_games_checks(
                        current_checks,
                        fixture_id,
                        checks,
                    )),
                set_is_starting: (fixture_id: string, value: boolean) =>
                    (is_starting = update_live_games_starting_state(
                        is_starting,
                        fixture_id,
                        value,
                    )),
            }),
        );
    }
</script>

<LiveGamesPageContent
    {organizations}
    bind:selected_organization_id
    can_change_organizations={can_user_change_live_games_organization(
        get_live_games_current_profile_state(get(auth_store)),
    )}
    is_loading_fixtures={route_view.is_loading_fixtures}
    on_organization_change={handle_organization_change}
    {permission_info_message}
    is_loading={route_view.is_loading}
    error_message={route_view.error_message}
    incomplete_fixtures={route_view.fixture_state.fixtures}
    {can_start_games}
    team_names={route_view.fixture_state.team_names}
    team_logo_urls={route_view.fixture_state.team_logo_urls}
    competition_names={route_view.fixture_state.competition_names}
    sport_names={route_view.fixture_state.sport_names}
    {current_checks}
    {is_starting}
    on_start_click={handle_start_click}
    {pending_start_fixture_state}
    on_cancel_start={() => (pending_start_fixture_state = IDLE_PENDING_START)}
    on_confirm_start={confirm_start_fixture}
/>
