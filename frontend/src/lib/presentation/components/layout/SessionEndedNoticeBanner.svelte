<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { run_header_logout } from "$lib/presentation/logic/headerAccountActions";
    import { get_is_auth_page } from "$lib/presentation/logic/layoutLogic";
    import { sign_out_and_tear_down_device } from "$lib/presentation/logic/logoutDeviceTeardownRuntime";
    import {
        build_session_ended_notice_message,
        build_session_ended_notice_message_without_count,
        SESSION_ENDED_NOTICE_STATUS,
        session_ended_notice_store,
        SESSION_ENDED_NOTICE_TEXT,
        type SessionEndedNoticeState,
    } from "$lib/presentation/stores/sessionEndedNotice";
    import { session_sync_notice_store } from "$lib/presentation/stores/sessionSyncNotice";

    const TITLE_ELEMENT_ID = "session-ended-notice-title";
    const SIGN_IN_PATH = "/sign-in";

    let is_clearing = false;

    function describe_notice(notice: SessionEndedNoticeState): string {
        switch (notice.status) {
            case SESSION_ENDED_NOTICE_STATUS.VISIBLE:
                return build_session_ended_notice_message(
                    notice.unsynced_change_count,
                );
            case SESSION_ENDED_NOTICE_STATUS.VISIBLE_COUNT_UNKNOWN:
            case SESSION_ENDED_NOTICE_STATUS.HIDDEN:
                return build_session_ended_notice_message_without_count();
        }
    }

    function handle_sign_in(): Promise<void> {
        return goto(SIGN_IN_PATH);
    }

    async function handle_discard_and_continue(): Promise<boolean> {
        is_clearing = true;
        const logout_result = await run_header_logout({
            sign_out_and_tear_down_device,
            show_session_notice: session_sync_notice_store.show,
        });
        is_clearing = false;
        return logout_result.success;
    }

    $: is_visible =
        $session_ended_notice_store.status !==
            SESSION_ENDED_NOTICE_STATUS.HIDDEN &&
        !get_is_auth_page($page.url.pathname);
</script>

{#if is_visible}
    <div
        class="fixed inset-0 z-[10001] flex items-end justify-center bg-black/50 px-4 pb-4 sm:items-center sm:pb-0"
    >
        <div
            class="w-full max-w-md rounded-xl border border-amber-500 bg-amber-50 p-5 text-amber-900 shadow-xl dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={TITLE_ELEMENT_ID}
        >
            <p id={TITLE_ELEMENT_ID} class="text-base font-semibold">
                {SESSION_ENDED_NOTICE_TEXT.TITLE}
            </p>
            <p class="mt-2 text-sm font-medium leading-6">
                {describe_notice($session_ended_notice_store)}
            </p>
            <p class="mt-1 text-sm leading-6">
                {SESSION_ENDED_NOTICE_TEXT.DETAIL}
            </p>
            <div
                class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
                <button
                    type="button"
                    class="rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
                    disabled={is_clearing}
                    on:click={handle_sign_in}
                >
                    {SESSION_ENDED_NOTICE_TEXT.SIGN_IN_AGAIN}
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
                    disabled={is_clearing}
                    on:click={handle_discard_and_continue}
                >
                    {is_clearing
                        ? SESSION_ENDED_NOTICE_TEXT.CLEARING
                        : SESSION_ENDED_NOTICE_TEXT.DISCARD_AND_CONTINUE}
                </button>
            </div>
        </div>
    </div>
{/if}
