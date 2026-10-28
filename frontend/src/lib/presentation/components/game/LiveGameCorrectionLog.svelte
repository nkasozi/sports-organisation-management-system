<script lang="ts">
    import {
        EVENT_CORRECTION_KIND,
        type EventCorrectionRecord,
    } from "$lib/core/entities/FixtureEventCorrections";

    export let corrections: EventCorrectionRecord[] = [];

    const TIME_FORMAT: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    };

    function describe(correction: EventCorrectionRecord): string {
        switch (correction.kind) {
            case EVENT_CORRECTION_KIND.EDITED:
                return `Changed ${correction.event_before} → ${correction.event_after}`;
            case EVENT_CORRECTION_KIND.REMOVED:
                return `Removed ${correction.event_before}`;
            case EVENT_CORRECTION_KIND.EDITS_RESET:
                return "Gave the table official a fresh set of event edits";
        }
    }

    function format_time(value: string): string {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleString(void 0, TIME_FORMAT);
    }
</script>

{#if corrections.length > 0}
    <section class="mt-6" aria-labelledby="correction_log_title">
        <h3
            id="correction_log_title"
            class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3"
        >
            Corrections ({corrections.length})
        </h3>
        <ol class="space-y-2">
            {#each [...corrections].reverse() as correction (correction.id)}
                <li
                    class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-sm"
                >
                    <p class="font-medium text-gray-900 dark:text-white">
                        {describe(correction)}
                    </p>
                    {#if correction.kind !== EVENT_CORRECTION_KIND.EDITS_RESET}
                        <p class="text-gray-700 dark:text-gray-300">
                            Reason: {correction.reason}
                        </p>
                    {/if}
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {correction.corrected_by} ({correction.corrected_by_role})
                        · {format_time(correction.corrected_at)}
                    </p>
                </li>
            {/each}
        </ol>
    </section>
{/if}
