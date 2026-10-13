<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type {
        MatchReportCompetitionState,
        MatchReportVenueState,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import {
        format_match_report_kickoff_display,
        type MatchReportViewState,
    } from "$lib/presentation/logic/matchReportPageState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

    export let fixture: Fixture;
    export let competition_state: MatchReportCompetitionState;
    export let venue_state: MatchReportVenueState;
    export let view_state: MatchReportViewState;
    export let live_poll_interval_ms: number;
</script>

<div
    class="bg-gray-800 text-gray-300 px-4 py-2 text-center text-sm border-t border-gray-700"
>
    <div
        class="max-w-4xl mx-auto flex items-center justify-center gap-3 flex-wrap"
    >
        {#if competition_state.status === PRESENCE_STATUS.PRESENT}
            <span class="font-medium">{competition_state.competition.name}</span
            >
            <span class="text-gray-600">·</span>
        {/if}
        <span class="text-gray-400">
            {format_match_report_kickoff_display(
                fixture.scheduled_date,
                fixture.scheduled_time,
            )}
        </span>
        {#if venue_state.status === PRESENCE_STATUS.PRESENT}
            <span class="text-gray-600">·</span>
            <span class="text-gray-400">📍 {venue_state.venue.name}</span>
        {/if}
    </div>
</div>

{#if view_state.is_game_in_progress}
    <div class="bg-green-900/30 border-b border-green-800/50 px-4 py-2">
        <div class="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <span class="relative flex h-2 w-2">
                <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span
                    class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                ></span>
            </span>
            <span class="text-sm text-green-300 font-medium">
                Match in progress — updates every {live_poll_interval_ms /
                    1000}s
            </span>
        </div>
    </div>
{/if}
