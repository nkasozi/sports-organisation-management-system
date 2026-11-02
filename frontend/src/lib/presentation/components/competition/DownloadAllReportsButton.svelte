<script lang="ts">
    import { DOWNLOAD_ALL_REPORTS_TEXT } from "./competitionResultsDisplayConstants";

    export let downloading_all_reports: boolean;
    export let on_download_all_reports: () => Promise<boolean>;
</script>

<button
    type="button"
    class="flex items-center justify-center gap-2 px-3 h-8 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-[0.175rem] transition-colors disabled:opacity-50 shrink-0"
    disabled={downloading_all_reports}
    on:click={() => void on_download_all_reports()}
>
    {#if downloading_all_reports}
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"
            ><circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            ></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path></svg
        >
        {DOWNLOAD_ALL_REPORTS_TEXT.GENERATING}
    {:else}
        <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            /></svg
        >
        {DOWNLOAD_ALL_REPORTS_TEXT.IDLE}
    {/if}
</button>
