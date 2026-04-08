<script lang="ts">
    import "../../../../app.css";

    import { injectAnalytics } from "@vercel/analytics/sveltekit";
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { afterNavigate, goto } from "$app/navigation";
    import { navigating, page } from "$app/stores";
    import {
        is_clerk_loaded,
        is_signed_in,
        set_navigating,
        sign_out,
    } from "$lib/adapters/iam/clerkAuthService";
    import {
        initialize_app_data,
        reset_initialization,
    } from "$lib/adapters/initialization/appInitializer";
    import { reset_all_data } from "$lib/adapters/initialization/dataResetService";
    import { reset_database } from "$lib/adapters/repositories/database";
    import { EventBus } from "$lib/infrastructure/events/EventBus";
    import {
        set_pulling_from_remote,
        start_background_sync,
        stop_background_sync,
        trigger_full_sync_on_page_reload,
    } from "$lib/infrastructure/sync/backgroundSyncService";
    import {
        pull_user_scoped_record_from_convex,
        reset_sync_metadata,
        write_convex_user_to_local_dexie,
    } from "$lib/infrastructure/sync/convexSyncService";
    import RootLayoutShell from "$lib/presentation/components/layout/RootLayoutShell.svelte";
    import { ensure_route_access } from "$lib/presentation/logic/authGuard";
    import {
        determine_session_action,
        is_in_app_navigation,
        is_route_guard_exempt,
    } from "$lib/presentation/logic/layoutLogic";
    import { sync_verified_user_login_session } from "$lib/presentation/logic/layoutLoginSync";
    import { subscribe_root_layout_state } from "$lib/presentation/logic/layoutRouteSubscriptions";
    import { create_layout_login_sync_dependencies } from "$lib/presentation/logic/layoutSessionFlowDependencies";
    import {
        handle_first_time_anonymous_user_session,
        handle_returning_anonymous_user_session,
        handle_verified_user_page_reload_session,
    } from "$lib/presentation/logic/layoutSessionFlows";
    import {
        auth_store,
        fetch_current_user_profile_from_convex,
    } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";
    import { current_user_store } from "$lib/presentation/stores/currentUser";
    import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
    import {
        clear_session_sync_flag,
        has_session_been_synced,
        initial_sync_store,
    } from "$lib/presentation/stores/initialSyncStore";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";
    import { sync_store } from "$lib/presentation/stores/syncStore";
    import { initialize_theme } from "$lib/presentation/stores/theme";
    injectAnalytics();

    let show_first_time_setup = false,
        show_initial_sync = false,
        app_ready = false,
        clerk_ready = false;
    let current_path = "",
        setup_status_message = "",
        setup_progress_percentage = 0,
        sync_status_message = "",
        sync_progress_percentage = 0;
    let cleanup_layout_subscriptions: (() => void) | null = null;
    let previous_signed_in_state = false;

    const delay = (milliseconds: number): Promise<void> =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));
    const login_sync_dependencies = create_layout_login_sync_dependencies({ initial_sync_store, get_initial_sync_state: () => get(initial_sync_store), auth_store, sync_store, stop_background_sync, start_background_sync, reset_database, reset_sync_metadata, fetch_current_user_profile_from_convex, set_pulling_from_remote, write_convex_user_to_local_dexie, pull_user_scoped_record_from_convex, clear_session_sync_flag, sign_out, goto, delay });

    afterNavigate(async ({ to, type }) => {
        if (!app_ready || !to?.url?.pathname) return;
        const pathname = to.url.pathname;
        if (is_route_guard_exempt(pathname)) return;
        if (!is_in_app_navigation(type)) await ensure_route_access(pathname);
        if (!get(is_signed_in)) return;
        EventBus.emit_page_viewed(pathname, document.title || pathname);
    });

    onMount(async () => {
        current_path = get(page).url.pathname;
        await initialize_theme();
        await branding_store.initialize();
        await public_organization_store.initialize();
        await current_user_store.initialize();
        cleanup_layout_subscriptions = subscribe_root_layout_state({
            navigating_store: navigating,
            page_store: page,
            first_time_setup_store,
            clerk_loaded_store: is_clerk_loaded,
            initial_sync_store,
            signed_in_store: is_signed_in,
            set_navigating,
            on_path_change: (pathname: string) => {
                current_path = pathname;
            },
            on_setup_change: (state) => {
                setup_status_message = state.status_message;
                setup_progress_percentage = state.progress_percentage;
                show_first_time_setup =
                    state.is_first_time && state.is_setting_up;
                if (state.setup_complete) show_first_time_setup = false;
            },
            on_clerk_ready_change: (loaded: boolean) => {
                clerk_ready = loaded;
            },
            on_sync_change: (state) => {
                sync_status_message = state.status_message;
                sync_progress_percentage = state.progress_percentage;
                show_initial_sync = state.is_syncing;
            },
            on_signed_in_change: async (signed_in: boolean) => {
                const user_just_signed_in =
                    signed_in && !previous_signed_in_state;
                previous_signed_in_state = signed_in;
                if (!user_just_signed_in || !app_ready) return;
                console.log(
                    "[Layout] User signed in detected, triggering login sync...",
                    { event: "user_sign_in_detected" },
                );
                await sync_verified_user_login_session(login_sync_dependencies);
            },
        });
        const session_already_synced = await has_session_been_synced();
        const init_result = await initialize_app_data({
            current_path,
            session_already_synced,
        });
        if (init_result === "redirect_to_login") {
            app_ready = true;
            clerk_ready = true;
            await goto("/sign-in?error=server_unavailable");
            return;
        }
        const session_action = determine_session_action(
            get(is_signed_in),
            session_already_synced,
        );
        if (session_action === "login_sync") {
            await sync_verified_user_login_session(login_sync_dependencies);
        } else if (session_action === "verified_page_reload") {
            await handle_verified_user_page_reload_session({
                auth_store,
                start_background_sync,
                trigger_full_sync_on_page_reload,
            });
        } else if (session_action === "first_time_anonymous") {
            await handle_first_time_anonymous_user_session({
                initial_sync_store,
                reset_all_data,
                auth_store,
            });
        } else {
            await handle_returning_anonymous_user_session({ auth_store });
        }
        app_ready = true;
        const initial_path = get(page).url.pathname;
        if (!is_route_guard_exempt(initial_path)) await ensure_route_access(initial_path);
    });
    onDestroy(() => {
        cleanup_layout_subscriptions?.();
        reset_initialization();
    });
</script>

<RootLayoutShell
    {show_initial_sync}
    {sync_status_message}
    {sync_progress_percentage}
    {app_ready}
    {clerk_ready}
    {show_first_time_setup}
    {setup_status_message}
    {setup_progress_percentage}
    {current_path}
>
    <slot />
</RootLayoutShell>
