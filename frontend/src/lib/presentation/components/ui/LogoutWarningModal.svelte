<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import LogoutWarningModalBody from "$lib/presentation/components/ui/logoutWarning/LogoutWarningModalBody.svelte";
    import {
        build_logout_discard_message,
        create_logout_sync_stop_control,
        evaluate_logout_request_with_stop,
        LOGOUT_WARNING_MODAL_STATE,
        LOGOUT_WARNING_TEXT,
        type LogoutWarningModalView,
    } from "$lib/presentation/logic/logoutWarningModalLogic";
    import { create_runtime_logout_warning_sync_port } from "$lib/presentation/logic/logoutWarningModalLogicRuntime";

    export let is_visible = false;

    const dispatch = createEventDispatcher<{
        cancel: void;
        confirm_logout: void;
    }>();

    const sync_port = create_runtime_logout_warning_sync_port();

    let modal_view: LogoutWarningModalView = {
        state: LOGOUT_WARNING_MODAL_STATE.CHECKING,
    };
    let visibility_check_generation = 0;
    let stop_control = create_logout_sync_stop_control();

    $: if (is_visible) void refresh_modal_view(is_visible);

    function show_syncing(check_generation: number): boolean {
        if (check_generation !== visibility_check_generation) return false;
        modal_view = { state: LOGOUT_WARNING_MODAL_STATE.SYNCING };
        return true;
    }

    async function refresh_modal_view(
        visible_when_requested: boolean,
    ): Promise<boolean> {
        if (!visible_when_requested) return false;
        visibility_check_generation += 1;
        const check_generation = visibility_check_generation;
        modal_view = { state: LOGOUT_WARNING_MODAL_STATE.CHECKING };
        stop_control = create_logout_sync_stop_control();
        const next_view = await evaluate_logout_request_with_stop(
            sync_port,
            () => show_syncing(check_generation),
            stop_control,
        );
        if (check_generation !== visibility_check_generation || !is_visible)
            return false;
        modal_view = next_view;
        if (next_view.state === LOGOUT_WARNING_MODAL_STATE.READY_TO_SIGN_OUT)
            dispatch("confirm_logout");
        return true;
    }

    function handle_confirm(): boolean {
        return dispatch("confirm_logout");
    }

    function handle_stop_syncing(): boolean {
        return stop_control.stop();
    }

    function handle_cancel(): boolean {
        visibility_check_generation += 1;
        return dispatch("cancel");
    }
</script>

{#if is_visible}
    {#if modal_view.state === LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING}
        <ConfirmationModal
            is_visible={true}
            title={LOGOUT_WARNING_TEXT.DISCARD_TITLE}
            message={build_logout_discard_message(
                modal_view.unsynced_change_count,
            )}
            confirm_text={LOGOUT_WARNING_TEXT.DISCARD_CONFIRM}
            cancel_text={LOGOUT_WARNING_TEXT.CANCEL}
            is_destructive={true}
            on:confirm={handle_confirm}
            on:cancel={handle_cancel}
        />
    {:else if modal_view.state === LOGOUT_WARNING_MODAL_STATE.COUNT_UNAVAILABLE}
        <ConfirmationModal
            is_visible={true}
            title={LOGOUT_WARNING_TEXT.COUNT_UNAVAILABLE_TITLE}
            message={LOGOUT_WARNING_TEXT.COUNT_UNAVAILABLE_MESSAGE}
            confirm_text={LOGOUT_WARNING_TEXT.COUNT_UNAVAILABLE_CONFIRM}
            cancel_text={LOGOUT_WARNING_TEXT.CANCEL}
            is_destructive={true}
            on:confirm={handle_confirm}
            on:cancel={handle_cancel}
        />
    {:else if modal_view.state !== LOGOUT_WARNING_MODAL_STATE.READY_TO_SIGN_OUT}
        <LogoutWarningModalBody
            modal_state={modal_view.state}
            on_stop_syncing={handle_stop_syncing}
        />
    {/if}
{/if}
