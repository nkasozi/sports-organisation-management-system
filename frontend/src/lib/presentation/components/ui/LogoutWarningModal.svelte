<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        has_pending_unsynced_changes,
        flush_pending_changes,
        get_background_sync_status,
    } from "$lib/infrastructure/sync/backgroundSyncService";

    export let is_visible: boolean = false;

    type ModalState =
        | "checking"
        | "warning"
        | "syncing"
        | "sync_failed"
        | "offline";

    let modal_state: ModalState = "checking";
    let sync_error_message: string = "";

    const dispatch = createEventDispatcher<{
        confirm_logout: void;
        cancel: void;
    }>();

    $: if (is_visible) {
        check_sync_status();
    }

    function check_sync_status(): void {
        modal_state = "checking";

        const status = get_background_sync_status();

        if (!status.is_online && status.has_pending_changes) {
            modal_state = "offline";
            return;
        }

        if (has_pending_unsynced_changes()) {
            modal_state = "warning";
            return;
        }

        dispatch("confirm_logout");
    }

    async function handle_sync_and_logout(): Promise<void> {
        modal_state = "syncing";

        const result = await flush_pending_changes();

        if (result.skipped_offline) {
            modal_state = "offline";
            return;
        }

        if (!result.success) {
            modal_state = "sync_failed";
            sync_error_message =
                "Failed to sync changes to the server. Your local data may be lost if you logout.";
            return;
        }

        dispatch("confirm_logout");
    }

    function handle_logout_anyway(): void {
        dispatch("confirm_logout");
    }

    function handle_cancel(): void {
        dispatch("cancel");
    }

    function handle_backdrop_click(): void {
        if (modal_state !== "syncing") {
            handle_cancel();
        }
    }

    function handle_key_down(event: KeyboardEvent): void {
        if (event.key === "Escape" && modal_state !== "syncing") {
            handle_cancel();
        }
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
            {#if modal_state === "checking"}
                <div class="flex flex-col items-center py-4">
                    <span
                        class="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary-200 border-t-theme-primary-600 mb-4"
                    ></span>
                    <p class="text-accent-600 dark:text-accent-400">
                        Checking for unsynced data...
                    </p>
                </div>
            {:else if modal_state === "warning"}
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <svg
                            class="h-6 w-6 text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                        >
                            Unsynced Changes Detected
                        </h3>
                        <p class="mt-2 text-accent-600 dark:text-accent-400">
                            You have local changes that haven't been synced to
                            the server yet. Would you like to sync your data
                            before logging out?
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-2 mt-6">
                    <button
                        type="button"
                        class="btn btn-primary w-full"
                        on:click={handle_sync_and_logout}
                    >
                        Sync and Logout
                    </button>
                    <button
                        type="button"
                        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
                        on:click={handle_logout_anyway}
                    >
                        Logout Without Syncing (Data Will Be Lost)
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline w-full"
                        on:click={handle_cancel}
                    >
                        Cancel
                    </button>
                </div>
            {:else if modal_state === "syncing"}
                <div class="flex flex-col items-center py-4">
                    <span
                        class="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary-200 border-t-theme-primary-600 mb-4"
                    ></span>
                    <h3
                        class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2"
                    >
                        Syncing Your Data
                    </h3>
                    <p class="text-accent-600 dark:text-accent-400 text-center">
                        Please wait while we upload your changes to the
                        server...
                    </p>
                </div>
            {:else if modal_state === "sync_failed"}
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <svg
                            class="h-6 w-6 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                        >
                            Sync Failed
                        </h3>
                        <p class="mt-2 text-accent-600 dark:text-accent-400">
                            {sync_error_message}
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-2 mt-6">
                    <button
                        type="button"
                        class="btn btn-primary w-full"
                        on:click={handle_sync_and_logout}
                    >
                        Try Again
                    </button>
                    <button
                        type="button"
                        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
                        on:click={handle_logout_anyway}
                    >
                        Logout Anyway (Data Will Be Lost)
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline w-full"
                        on:click={handle_cancel}
                    >
                        Cancel
                    </button>
                </div>
            {:else if modal_state === "offline"}
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <svg
                            class="h-6 w-6 text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                            />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                        >
                            You're Offline
                        </h3>
                        <p class="mt-2 text-accent-600 dark:text-accent-400">
                            You have unsynced changes but are currently offline.
                            These changes cannot be saved to the server until
                            you're back online.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-2 mt-6">
                    <button
                        type="button"
                        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
                        on:click={handle_logout_anyway}
                    >
                        Logout Anyway (Data Will Be Lost)
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline w-full"
                        on:click={handle_cancel}
                    >
                        Stay Logged In
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}
