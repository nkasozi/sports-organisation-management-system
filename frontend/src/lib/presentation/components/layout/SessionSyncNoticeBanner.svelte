<script lang="ts">
    import {
        get_session_sync_notice_content,
        SESSION_SYNC_NOTICE_STATUS,
        session_sync_notice_store,
    } from "$lib/presentation/stores/sessionSyncNotice";

    const TITLE_ELEMENT_ID = "session-sync-notice-title";
</script>

{#if $session_sync_notice_store.status === SESSION_SYNC_NOTICE_STATUS.VISIBLE}
    {@const notice_content = get_session_sync_notice_content(
        $session_sync_notice_store.kind,
    )}
    <div
        class="fixed inset-x-0 bottom-0 z-[10001] px-4 pb-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:px-0 sm:pb-0"
    >
        <div
            class="rounded-xl border border-amber-500 bg-amber-50 p-4 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
            role="alert"
            aria-labelledby={TITLE_ELEMENT_ID}
        >
            <p id={TITLE_ELEMENT_ID} class="text-sm font-semibold">
                {notice_content.title}
            </p>
            <p class="mt-1 text-sm leading-6">{notice_content.message}</p>
            <div class="mt-3 flex justify-end">
                <button
                    type="button"
                    class="rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    on:click={session_sync_notice_store.dismiss}
                >
                    Dismiss
                </button>
            </div>
        </div>
    </div>
{/if}
