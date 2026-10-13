<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import LogoutWarningModalBody from "$lib/presentation/components/ui/logoutWarning/LogoutWarningModalBody.svelte";
    import {
        get_logout_warning_modal_state,
        LOGOUT_WARNING_MODAL_STATE,
        type LogoutWarningModalState,
        sync_logout_warning_modal_changes,
    } from "$lib/presentation/logic/logoutWarningModalLogic";
    import { create_runtime_logout_warning_sync_port } from "$lib/presentation/logic/logoutWarningModalLogicRuntime";

    export let is_visible = false;

    const ESCAPE_KEY = "Escape";

    const dispatch = createEventDispatcher<{
        cancel: void;
        confirm_logout: void;
    }>();

    const sync_port = create_runtime_logout_warning_sync_port();

    let modal_state: LogoutWarningModalState =
        LOGOUT_WARNING_MODAL_STATE.CHECKING;
    let sync_error_message = "";
    let visibility_check_generation = 0;

    $: if (is_visible) void refresh_modal_state(is_visible);

    async function refresh_modal_state(
        visible_when_requested: boolean,
    ): Promise<boolean> {
        if (!visible_when_requested) return false;
        visibility_check_generation += 1;
        const check_generation = visibility_check_generation;
        modal_state = LOGOUT_WARNING_MODAL_STATE.CHECKING;
        const state_result = await get_logout_warning_modal_state(sync_port);
        if (check_generation !== visibility_check_generation || !is_visible)
            return false;
        modal_state = state_result.modal_state;
        if (state_result.should_confirm_logout) dispatch("confirm_logout");
        return true;
    }

    async function handle_sync_and_logout(): Promise<void> {
        modal_state = LOGOUT_WARNING_MODAL_STATE.SYNCING;
        const sync_result = await sync_logout_warning_modal_changes(sync_port);
        modal_state = sync_result.modal_state;
        sync_error_message = sync_result.sync_error_message;
        if (sync_result.should_confirm_logout) dispatch("confirm_logout");
    }

    function handle_logout_anyway(): void {
        dispatch("confirm_logout");
    }

    function handle_cancel(): void {
        dispatch("cancel");
    }

    function handle_backdrop_click(): void {
        if (modal_state !== LOGOUT_WARNING_MODAL_STATE.SYNCING) handle_cancel();
    }

    function handle_key_down(event: KeyboardEvent): void {
        if (
            is_visible &&
            event.key === ESCAPE_KEY &&
            modal_state !== LOGOUT_WARNING_MODAL_STATE.SYNCING
        )
            handle_cancel();
    }
</script>

<svelte:window on:keydown={handle_key_down} />

{#if is_visible}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        on:click={handle_backdrop_click}
        on:keydown={handle_backdrop_click}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
    >
        <div
            class="bg-white dark:bg-accent-800 rounded-lg shadow-xl max-w-md w-full p-6"
            role="none"
            on:click|stopPropagation
            on:keydown|stopPropagation
        >
            {#if modal_state === LOGOUT_WARNING_MODAL_STATE.COUNT_UNAVAILABLE}
                <div class="space-y-6">
                    <div>
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                        >
                            Unsynced Changes Could Not Be Checked
                        </h3>
                        <p class="mt-2 text-accent-600 dark:text-accent-400">
                            We could not check this device for changes that
                            still need to sync. Logging out now may lose them.
                        </p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button
                            type="button"
                            class="btn btn-outline w-full"
                            on:click={handle_cancel}>Stay Logged In</button
                        >
                        <button
                            type="button"
                            class="btn bg-red-600 hover:bg-red-700 text-white w-full"
                            on:click={handle_logout_anyway}
                            >Logout Anyway (Data May Be Lost)</button
                        >
                    </div>
                </div>
            {:else}
                <LogoutWarningModalBody
                    {modal_state}
                    {sync_error_message}
                    on_cancel={handle_cancel}
                    on_logout_anyway={handle_logout_anyway}
                    on_sync_and_logout={handle_sync_and_logout}
                />
            {/if}
        </div>
    </div>
{/if}
