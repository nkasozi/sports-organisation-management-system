<script lang="ts">
    import "../../../../app.css";

    import { inject } from "@vercel/analytics";
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";

    import { goto } from "$app/navigation";
    import { navigating, page } from "$app/stores";
    import {
        is_clerk_loaded,
        is_signed_in,
        set_navigating,
    } from "$lib/adapters/iam/clerkAuthService";
    import {
        initialize_app_data,
        reset_initialization,
    } from "$lib/adapters/initialization/appInitializer";
    import RootLayoutShell from "$lib/presentation/components/layout/RootLayoutShell.svelte";
    import {
        create_hidden_login_local_change_prompt_state,
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE,
        type LoginLocalChangePromptState,
    } from "$lib/presentation/logic/layoutLoginLocalChangePrompt";
    import { create_login_local_change_prompt_gate } from "$lib/presentation/logic/layoutLoginLocalChangePromptGate";
    import {
        guard_root_layout_initial_route,
        register_root_layout_navigation_guards,
    } from "$lib/presentation/logic/layoutNavigationGuardRuntime";
    import {
        create_root_layout_restore_progress_callbacks,
        create_root_layout_subscription_callbacks,
    } from "$lib/presentation/logic/layoutRootLayoutCallbacks";
    import {
        create_root_layout_login_sync_dependencies,
        create_root_layout_session_handlers,
        create_root_layout_startup_storage_recovery_dependencies,
        initialize_root_layout_stores,
    } from "$lib/presentation/logic/layoutRootLayoutRuntime";
    import {
        ROOT_LAYOUT_STARTUP_OUTCOME,
        run_root_layout_startup,
    } from "$lib/presentation/logic/layoutRootLayoutStartup";
    import {
        create_initial_root_layout_view_state,
        mark_root_layout_ready,
        mark_root_layout_redirected,
        type RootLayoutViewState,
    } from "$lib/presentation/logic/layoutRootLayoutViewState";
    import { subscribe_root_layout_state } from "$lib/presentation/logic/layoutRouteSubscriptions";
    import {
        complete_root_layout_pending_clerk_sign_out,
        handle_root_layout_user_signed_in,
        handle_root_layout_user_signed_out,
    } from "$lib/presentation/logic/layoutSessionTransitionRuntime";
    import { run_startup_storage_recovery } from "$lib/presentation/logic/layoutStartupStorageRecoveryFlow";
    import { create_startup_storage_recovery_choice_gate } from "$lib/presentation/logic/layoutStartupStorageRecoveryGate";
    import {
        create_hidden_startup_storage_recovery_prompt_state,
        STARTUP_STORAGE_RECOVERY_CHOICE,
        type StartupStorageRecoveryPromptState,
    } from "$lib/presentation/logic/layoutStorageRecovery";
    import {
        build_sign_in_error_path,
        SIGN_IN_ERROR_CODE,
    } from "$lib/presentation/logic/signInPageState";
    import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
    import {
        has_session_been_synced,
        initial_sync_store,
        resolve_current_device_session,
    } from "$lib/presentation/stores/initialSyncStore";

    const VERCEL_ANALYTICS_FRAMEWORK = "sveltekit";
    const RECOVERY_CHOICE = STARTUP_STORAGE_RECOVERY_CHOICE;
    const LOCAL_CHANGE_CHOICE = LOGIN_LOCAL_CHANGE_PROMPT_CHOICE;
    const navigating_state_store = derived(navigating, ($navigating) =>
        Boolean($navigating),
    );

    inject({ framework: VERCEL_ANALYTICS_FRAMEWORK });

    let view_state: RootLayoutViewState =
        create_initial_root_layout_view_state("");
    let storage_recovery_prompt_state: StartupStorageRecoveryPromptState =
        create_hidden_startup_storage_recovery_prompt_state();
    let login_local_change_prompt_state: LoginLocalChangePromptState =
        create_hidden_login_local_change_prompt_state();
    let cleanup_layout_subscriptions: () => void = () => {};

    const storage_recovery_choice_gate =
        create_startup_storage_recovery_choice_gate((prompt_state) => {
            storage_recovery_prompt_state = prompt_state;
            return true;
        });
    const login_local_change_prompt_gate =
        create_login_local_change_prompt_gate((prompt_state) => {
            login_local_change_prompt_state = prompt_state;
            return true;
        });
    const login_sync_dependencies = create_root_layout_login_sync_dependencies(
        login_local_change_prompt_gate.request_discard_confirmation,
    );

    function update_view_state(
        transform: (state: RootLayoutViewState) => RootLayoutViewState,
    ): boolean {
        view_state = transform(view_state);
        return true;
    }

    function subscribe_layout_state(): boolean {
        cleanup_layout_subscriptions = subscribe_root_layout_state({
            navigating_store: navigating_state_store,
            page_store: page,
            first_time_setup_store,
            clerk_loaded_store: is_clerk_loaded,
            initial_sync_store,
            signed_in_store: is_signed_in,
            set_navigating,
            ...create_root_layout_subscription_callbacks({
                update_view_state,
                is_app_ready: () => view_state.app_ready,
                on_user_signed_in: () =>
                    handle_root_layout_user_signed_in(login_sync_dependencies),
                on_user_signed_out: handle_root_layout_user_signed_out,
            }),
        });
        return true;
    }

    function run_storage_recovery(): Promise<unknown> {
        return run_startup_storage_recovery(
            create_root_layout_startup_storage_recovery_dependencies({
                wait_for_choice: storage_recovery_choice_gate.wait_for_choice,
                ...create_root_layout_restore_progress_callbacks(
                    update_view_state,
                ),
            }),
        );
    }

    register_root_layout_navigation_guards(() => view_state.app_ready);

    onMount(async () => {
        view_state = { ...view_state, current_path: get(page).url.pathname };
        const startup_outcome = await run_root_layout_startup({
            current_path: view_state.current_path,
            run_startup_storage_recovery: run_storage_recovery,
            initialize_stores: initialize_root_layout_stores,
            subscribe_layout_state,
            has_session_been_synced,
            resolve_current_device_session,
            complete_pending_clerk_sign_out:
                complete_root_layout_pending_clerk_sign_out,
            initialize_app_data,
            is_signed_in: () => get(is_signed_in),
            session_handlers: create_root_layout_session_handlers(
                login_sync_dependencies,
            ),
        });
        if (
            startup_outcome === ROOT_LAYOUT_STARTUP_OUTCOME.SERVER_UNAVAILABLE
        ) {
            view_state = mark_root_layout_redirected(view_state);
            await goto(
                build_sign_in_error_path(SIGN_IN_ERROR_CODE.SERVER_UNAVAILABLE),
            );
            return;
        }
        view_state = mark_root_layout_ready(view_state);
        await guard_root_layout_initial_route(get(page).url.pathname);
    });
    onDestroy(() => {
        cleanup_layout_subscriptions();
        reset_initialization();
    });
</script>

<RootLayoutShell
    {...view_state}
    {storage_recovery_prompt_state}
    {login_local_change_prompt_state}
    on_restore_storage_backup={() =>
        storage_recovery_choice_gate.resolve_choice(RECOVERY_CHOICE.RESTORE)}
    on_continue_without_storage_backup={() =>
        storage_recovery_choice_gate.resolve_choice(RECOVERY_CHOICE.CONTINUE)}
    on_discard_local_changes={() =>
        login_local_change_prompt_gate.resolve_choice(
            LOCAL_CHANGE_CHOICE.DISCARD_AND_CONTINUE,
        )}
    on_keep_local_changes={() =>
        login_local_change_prompt_gate.resolve_choice(
            LOCAL_CHANGE_CHOICE.KEEP_AND_SIGN_OUT,
        )}
>
    <slot />
</RootLayoutShell>
