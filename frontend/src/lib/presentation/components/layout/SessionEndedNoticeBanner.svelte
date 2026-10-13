<script lang="ts">
    import { goto } from "$app/navigation";
    import LogoutWarningModal from "$lib/presentation/components/ui/LogoutWarningModal.svelte";
    import { run_header_logout } from "$lib/presentation/logic/headerAccountActions";
    import { sign_out_and_tear_down_device } from "$lib/presentation/logic/logoutDeviceTeardownRuntime";
    import {
        build_session_ended_notice_message,
        SESSION_ENDED_NOTICE_STATUS,
        session_ended_notice_store,
        SESSION_ENDED_NOTICE_TITLE,
    } from "$lib/presentation/stores/sessionEndedNotice";
    import { session_sync_notice_store } from "$lib/presentation/stores/sessionSyncNotice";

    const TITLE_ELEMENT_ID = "session-ended-notice-title";
    const SIGN_IN_PATH = "/sign-in";

    let show_logout_warning = false;

    function handle_sign_in(): Promise<void> {
        return goto(SIGN_IN_PATH);
    }

    function handle_sign_out_requested(): boolean {
        show_logout_warning = true;
        return true;
    }

    function handle_logout_cancelled(): boolean {
        show_logout_warning = false;
        return true;
    }

    async function handle_logout_confirmed(): Promise<boolean> {
        show_logout_warning = false;
        const logout_result = await run_header_logout({
            sign_out_and_tear_down_device,
            show_session_notice: session_sync_notice_store.show,
        });
        return logout_result.success;
    }
</script>

{#if $session_ended_notice_store.status === SESSION_ENDED_NOTICE_STATUS.VISIBLE}
    <div
        class="fixed inset-x-0 bottom-0 z-[10001] px-4 pb-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:px-0 sm:pb-0"
    >
        <div
            class="rounded-xl border border-amber-500 bg-amber-50 p-4 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
            role="alert"
            aria-labelledby={TITLE_ELEMENT_ID}
        >
            <p id={TITLE_ELEMENT_ID} class="text-sm font-semibold">
                {SESSION_ENDED_NOTICE_TITLE}
            </p>
            <p class="mt-1 text-sm leading-6">
                {build_session_ended_notice_message(
                    $session_ended_notice_store.unsynced_change_count,
                )}
            </p>
            <div
                class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
                <button
                    type="button"
                    class="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    on:click={handle_sign_out_requested}
                >
                    Sign out and discard
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    on:click={handle_sign_in}
                >
                    Sign in to sync
                </button>
            </div>
        </div>
    </div>
{/if}

<LogoutWarningModal
    is_visible={show_logout_warning}
    on:confirm_logout={handle_logout_confirmed}
    on:cancel={handle_logout_cancelled}
/>
