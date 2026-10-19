<script lang="ts">
    import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
    import {
        LOCAL_RECORD_TAMPER_NOTICE_STATUS,
        local_record_tamper_notice_store,
    } from "$lib/presentation/stores/localRecordTamperNotice";

    export let on_reload_from_server: () => Promise<unknown>;

    const TITLE_ELEMENT_ID = "local-record-tamper-notice-title";

    function reload_from_server(): Promise<unknown> {
        local_record_tamper_notice_store.dismiss();
        return on_reload_from_server();
    }
</script>

{#if $local_record_tamper_notice_store.status === LOCAL_RECORD_TAMPER_NOTICE_STATUS.VISIBLE}
    <div
        class="fixed inset-x-0 top-0 z-[10001] px-4 pt-4 sm:left-auto sm:right-4 sm:max-w-md sm:px-0"
    >
        <div
            class="rounded-xl border border-amber-500 bg-amber-50 p-4 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
            role="alert"
            aria-labelledby={TITLE_ELEMENT_ID}
        >
            <p id={TITLE_ELEMENT_ID} class="text-sm font-semibold">
                Some data was ignored
            </p>
            <p class="mt-1 text-sm leading-6">
                Some data on this device was changed outside the app and has
                been ignored.
            </p>
            <div class="mt-3 flex justify-end gap-2">
                {#if $is_signed_in}
                    <button
                        type="button"
                        class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        on:click={reload_from_server}
                    >
                        Reload from server
                    </button>
                {/if}
                <button
                    type="button"
                    class="rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    on:click={local_record_tamper_notice_store.dismiss}
                >
                    Dismiss
                </button>
            </div>
        </div>
    </div>
{/if}
