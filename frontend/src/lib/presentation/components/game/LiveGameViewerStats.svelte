<script lang="ts">
    import { onMount } from "svelte";

    import {
        create_none_option,
        type Option,
        OptionStatus,
    } from "$lib/core/types/Option";
    import {
        summarize_loaded_viewer_stats,
        type ViewerStatsSummary,
    } from "$lib/presentation/logic/liveAudienceDisplay";
    import { load_live_game_viewer_stats } from "$lib/presentation/logic/liveAudienceRuntime";

    export let fixture_id: string;

    let summary: Option<ViewerStatsSummary> = create_none_option();

    onMount(async () => {
        summary = summarize_loaded_viewer_stats(
            await load_live_game_viewer_stats(fixture_id),
        );
    });
</script>

{#if summary.status === OptionStatus.SOME}{@const lines = summary.value}
    <section
        class="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        data-testid="live-viewer-stats"
    >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Live audience
        </h3>
        <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>{lines.followed_live}</li>
            <li>{lines.peak}</li>
            <li>{lines.watch_time}</li>
        </ul>
    </section>{/if}
