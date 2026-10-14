<script lang="ts">
    import {
        type ResolutionNotice,
        ResolutionNoticeStatus,
    } from "$lib/presentation/stores/conflictStoreResolutionFlow";

    export let notice: ResolutionNotice;
</script>

{#if notice.status === ResolutionNoticeStatus.SHOWN}
    <p
        role="alert"
        class="rounded-[0.175rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
        {notice.message}
    </p>
{/if}
