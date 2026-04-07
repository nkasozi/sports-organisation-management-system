<script lang="ts">
    import { onMount, tick } from "svelte";

    import { goto } from "$app/navigation";
    import {
        initialize_app_data,
        reset_initialization,
    } from "$lib/adapters/initialization/appInitializer";
    import { reset_all_data } from "$lib/adapters/initialization/dataResetService";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Team } from "$lib/core/entities/Team";
    import {
        ANY_VALUE,
        check_data_permission,
    } from "$lib/core/interfaces/ports";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_competition_use_cases,
        get_fixture_use_cases,
        get_organization_use_cases,
        get_player_use_cases,
        get_sport_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import DashboardHomePage from "$lib/presentation/components/dashboard/DashboardHomePage.svelte";
    import { ErrorDisplay } from "$lib/presentation/components/ui";
    import FullScreenOverlay from "$lib/presentation/components/ui/FullScreenOverlay.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import type { DashboardDependencies } from "$lib/presentation/logic/dashboardPageLogic";
    import { load_dashboard_data } from "$lib/presentation/logic/dashboardPageLogic";
    import { build_dashboard_filters } from "$lib/presentation/logic/dashboardStatsLogic";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";
    import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

    const dashboard_dependencies: DashboardDependencies = {
        organization_use_cases: get_organization_use_cases(),
        competition_use_cases: get_competition_use_cases(),
        team_use_cases: get_team_use_cases(),
        player_use_cases: get_player_use_cases(),
        fixture_use_cases: get_fixture_use_cases(),
        sport_use_cases: get_sport_use_cases(),
    };

    let loading: boolean = true;
    let is_resetting: boolean = false;
    let reset_status_message: string = "Clearing demo data...";
    let reset_progress: number = 0;
    let error_message: string = "";
    let access_denial_message: string = "";
    let stats = { organizations: 0, competitions: 0, teams: 0, players: 0 };
    let recent_competitions: Competition[] = [];
    let upcoming_fixtures: Fixture[] = [];
    let teams_map: Map<string, Team> = new Map();
    let competition_names: Record<string, string> = {};
    let sport_names: Record<string, string> = {};
    let competition_sport_names: Record<string, string> = {};

    $: current_user_organization_id =
        $auth_store.current_profile?.organization_id || "";
    $: user_is_super_admin = current_user_organization_id === ANY_VALUE;
    $: user_has_org_admin_access = check_data_permission(
        $auth_store.current_profile?.role || "player",
        "org_administrator_level",
        "read",
    );

    function dismiss_access_denial(): void {
        access_denial_message = "";
    }

    async function refresh_dashboard_data(): Promise<void> {
        loading = true;
        const dashboard_filters = build_dashboard_filters(
            $auth_store.current_profile?.role || "player",
            $auth_store.current_profile?.organization_id || "",
        );
        const result = await load_dashboard_data(
            dashboard_dependencies,
            dashboard_filters,
        );
        if (!result.success) {
            loading = false;
            return;
        }
        stats = result.data.stats;
        recent_competitions = result.data.recent_competitions;
        upcoming_fixtures = result.data.upcoming_fixtures;
        teams_map = result.data.teams_map;
        competition_names = result.data.competition_names;
        sport_names = result.data.sport_names;
        competition_sport_names = result.data.competition_sport_names;
        loading = false;
    }

    async function handle_reset_data(): Promise<boolean> {
        if (is_resetting) return false;
        reset_status_message = "Clearing demo data...";
        reset_progress = 0;
        is_resetting = true;
        await tick();
        const reset_result = await reset_all_data(
            (message: string, percentage: number) => {
                reset_status_message = message;
                reset_progress = percentage;
            },
        );
        if (!reset_result) {
            is_resetting = false;
            return false;
        }
        first_time_setup_store.reset();
        reset_initialization();
        await initialize_app_data({
            current_path: window.location.pathname,
            session_already_synced: false,
        });
        await refresh_dashboard_data();
        is_resetting = false;
        return true;
    }

    onMount(async () => {
        const denial_info = access_denial_store.get_and_clear();
        if (denial_info.denied) {
            access_denial_message = denial_info.message;
        }
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            loading = false;
            return;
        }
        const user_role = $auth_store.current_profile?.role || "player";
        const default_route_result =
            await get_authorization_adapter().get_default_route_for_role(
                user_role,
            );
        if (default_route_result.success && default_route_result.data !== "/") {
            await goto(default_route_result.data, { replaceState: true });
            return;
        }
        await refresh_dashboard_data();
    });
</script>

<svelte:head>
    <title>Dashboard - Sport-Sync</title>
    <meta
        name="description"
        content="Overview of your sports organization management system"
    />
</svelte:head>

{#if is_resetting}
    <FullScreenOverlay
        title="Resetting Demo Data"
        status_message={reset_status_message}
        progress_percentage={reset_progress}
    />
{/if}

{#if error_message}
    <ErrorDisplay
        variant="page"
        title="Unable to Load Dashboard"
        message={error_message}
    />
{:else}
    <DashboardHomePage
        {loading}
        {access_denial_message}
        organization_name={$branding_store.organization_name}
        organization_tagline={$branding_store.organization_tagline}
        {user_is_super_admin}
        {user_has_org_admin_access}
        {is_resetting}
        {stats}
        {recent_competitions}
        {upcoming_fixtures}
        {teams_map}
        {competition_names}
        {sport_names}
        {competition_sport_names}
        on_reset={handle_reset_data}
        on_dismiss_access_denial={dismiss_access_denial}
    />
{/if}
