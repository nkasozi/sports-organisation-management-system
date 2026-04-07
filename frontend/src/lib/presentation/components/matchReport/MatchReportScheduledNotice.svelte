<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Venue } from "$lib/core/entities/Venue";
    import { format_match_report_kickoff_display } from "$lib/presentation/logic/matchReportPageState";

    export let fixture: Fixture;
    export let venue: Venue | null;
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center"
>
    <div
        class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center"
    >
        <span class="text-3xl">📅</span>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Match Not Yet Started
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Kick-off: {format_match_report_kickoff_display(
            fixture.scheduled_date,
            fixture.scheduled_time,
        )}
    </p>
    {#if venue}
        <p class="text-sm text-gray-500 dark:text-gray-400">
            📍 {venue.name}{venue.city ? `, ${venue.city}` : ""}{venue.country
                ? `, ${venue.country}`
                : ""}
        </p>
    {/if}
</div>
