<script lang="ts">
    import { run_header_logout } from "$lib/presentation/logic/headerAccountActions";
    import { sign_out_and_tear_down_device } from "$lib/presentation/logic/logoutDeviceTeardownRuntime";
    import { session_sync_notice_store } from "$lib/presentation/stores/sessionSyncNotice";
    import {
        describe_session_sync_retry_notice,
        session_sync_retry_notice_store,
        SESSION_SYNC_RETRY_STATUS,
    } from "$lib/presentation/stores/sessionSyncRetryNotice";

    export let on_retry: () => Promise<unknown>;

    const TITLE_ELEMENT_ID = "session-sync-retry-title";
    const RETRY_TEXT = "Try again";
    const RETRYING_TEXT = "Trying again...";
    const SIGN_OUT_TEXT = "Sign out";

    let is_busy = false;

    async function handle_retry(): Promise<boolean> {
        is_busy = true;
        await on_retry();
        is_busy = false;
        return true;
    }

    async function handle_sign_out(): Promise<boolean> {
        is_busy = true;
        session_sync_retry_notice_store.dismiss();
        const logout_result = await run_header_logout({
            sign_out_and_tear_down_device,
            show_session_notice: session_sync_notice_store.show,
        });
        is_busy = false;
        return logout_result.success;
    }
</script>

{#if $session_sync_retry_notice_store.status === SESSION_SYNC_RETRY_STATUS.VISIBLE}
    {@const content = describe_session_sync_retry_notice(
        $session_sync_retry_notice_store.kind,
    )}
    <div
        class="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 px-4"
    >
        <div
            class="w-full max-w-md rounded-xl bg-white p-5 text-gray-900 shadow-xl dark:bg-gray-900 dark:text-gray-100"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={TITLE_ELEMENT_ID}
        >
            <p id={TITLE_ELEMENT_ID} class="text-base font-semibold">
                {content.title}
            </p>
            <p class="mt-2 text-sm leading-6">{content.message}</p>
            <div
                class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
                <button
                    type="button"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-60 dark:border-gray-600"
                    disabled={is_busy}
                    on:click={handle_sign_out}
                >
                    {SIGN_OUT_TEXT}
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-500 disabled:opacity-60"
                    disabled={is_busy}
                    on:click={handle_retry}
                >
                    {is_busy ? RETRYING_TEXT : RETRY_TEXT}
                </button>
            </div>
        </div>
    </div>
{/if}
