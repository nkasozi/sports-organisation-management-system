<script lang="ts">
    import { onMount, tick } from "svelte";

    import { goto } from "$app/navigation";
    import { reset_all_data } from "$lib/adapters/initialization/dataResetService";
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
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { TOAST_TYPE } from "$lib/presentation/components/ui/toastTypes";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        finish_dashboard_demo_reset,
        read_demo_profile_id,
    } from "$lib/presentation/logic/dashboardDemoResetProfile";
    import type { DashboardDependencies } from "$lib/presentation/logic/dashboardPageLogic";
    import { load_dashboard_data } from "$lib/presentation/logic/dashboardPageLogic";
    import { build_dashboard_filters } from "$lib/presentation/logic/dashboardStatsLogic";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";

    import {
        begin_dashboard_load,
        dashboard_data_of,
        DASHBOARD_FALLBACK_ROLE,
        DASHBOARD_HOME_ROUTE_PATH,
        DASHBOARD_ROUTE_MESSAGES,
        DASHBOARD_ROUTE_STATUS,
        type DashboardRouteState,
        fail_dashboard,
        settle_dashboard_load,
    } from "./dashboardRouteState";

    const dashboard_dependencies: DashboardDependencies = {
        organization_use_cases: get_organization_use_cases(),
        competition_use_cases: get_competition_use_cases(),
        team_use_cases: get_team_use_cases(),
        player_use_cases: get_player_use_cases(),
        fixture_use_cases: get_fixture_use_cases(),
        sport_use_cases: get_sport_use_cases(),
    };

    let dashboard_state: DashboardRouteState = begin_dashboard_load(
        fail_dashboard(""),
    );
    let is_resetting: boolean = false;
    let reset_status_message: string = DASHBOARD_ROUTE_MESSAGES.RESET_STARTED;
    let reset_progress: number = 0;
    let access_denial_message: string = "";
    let is_reset_failure_visible = false;

    $: dashboard_data = dashboard_data_of(dashboard_state);
    $: current_profile_state = $auth_store.current_profile;
    $: current_user_organization_id =
        current_profile_state.status === PRESENCE_STATUS.PRESENT
            ? current_profile_state.profile.organization_id
            : "";
    $: current_user_role =
        current_profile_state.status === PRESENCE_STATUS.PRESENT
            ? current_profile_state.profile.role
            : DASHBOARD_FALLBACK_ROLE;
    $: user_is_super_admin = current_user_organization_id === ANY_VALUE;
    $: user_has_org_admin_access = check_data_permission(
        current_user_role,
        "org_administrator_level",
        "read",
    );

    function dismiss_access_denial(): void {
        access_denial_message = "";
    }

    async function refresh_dashboard_data(): Promise<void> {
        dashboard_state = begin_dashboard_load(dashboard_state);
        dashboard_state = settle_dashboard_load(
            await load_dashboard_data(
                dashboard_dependencies,
                build_dashboard_filters(
                    current_user_role,
                    current_user_organization_id,
                ),
            ),
        );
    }

    async function handle_reset_data(): Promise<boolean> {
        if (is_resetting) return false;
        const previous = read_demo_profile_id($auth_store);
        reset_status_message = DASHBOARD_ROUTE_MESSAGES.RESET_STARTED;
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
            is_reset_failure_visible = true;
            return false;
        }
        await finish_dashboard_demo_reset(previous, window.location.pathname);
        is_resetting = false;
        void refresh_dashboard_data();
        return true;
    }

    onMount(async () => {
        const denial_info = access_denial_store.get_and_clear();
        if (denial_info.denied) {
            access_denial_message = denial_info.message;
        }
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            dashboard_state = fail_dashboard(auth_result.error_message);
            return;
        }
        const user_role = current_user_role;
        const default_route_result =
            await get_authorization_adapter().get_default_route_for_role(
                user_role,
            );
        if (
            default_route_result.success &&
            default_route_result.data !== DASHBOARD_HOME_ROUTE_PATH
        ) {
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
        title={DASHBOARD_ROUTE_MESSAGES.RESET_TITLE}
        status_message={reset_status_message}
        progress_percentage={reset_progress}
    />
{/if}

{#if dashboard_state.status === DASHBOARD_ROUTE_STATUS.FAILED}
    <ErrorDisplay
        variant="page"
        title={DASHBOARD_ROUTE_MESSAGES.LOAD_FAILED_TITLE}
        message={dashboard_state.message}
        on_retry={() => void refresh_dashboard_data()}
    />
{:else}
    <DashboardHomePage
        loading={dashboard_state.status === DASHBOARD_ROUTE_STATUS.LOADING}
        {access_denial_message}
        organization_name={$branding_store.organization_name}
        organization_tagline={$branding_store.organization_tagline}
        {user_is_super_admin}
        {user_has_org_admin_access}
        {is_resetting}
        {...dashboard_data}
        on_reset={handle_reset_data}
        on_dismiss_access_denial={dismiss_access_denial}
    />
{/if}
<Toast
    message={DASHBOARD_ROUTE_MESSAGES.RESET_FAILED}
    type={TOAST_TYPE.ERROR}
    bind:is_visible={is_reset_failure_visible}
/>
