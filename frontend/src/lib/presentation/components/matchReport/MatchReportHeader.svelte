<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import { get_period_display_name } from "$lib/core/entities/Fixture";
    import type { Team } from "$lib/core/entities/Team";
    import { get_team_logo } from "$lib/core/entities/Team";
    import type { Venue } from "$lib/core/entities/Venue";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";
    import {
        format_match_report_kickoff_display,
        get_match_report_status_color,
        get_match_report_status_label,
        type MatchReportViewState,
    } from "$lib/presentation/logic/matchReportPageState";

    export let fixture: Fixture;
    export let home_team: Team | null;
    export let away_team: Team | null;
    export let competition: Competition | null;
    export let organization_name: string;
    export let venue: Venue | null;
    export let view_state: MatchReportViewState;
    export let live_poll_interval_ms: number;
    export let downloading_report: boolean;
    export let on_back: () => void;
    export let on_download: () => void;
</script>

<div class="bg-gray-900 text-white px-4 py-4 sticky top-0 z-40">
    <div class="max-w-4xl mx-auto">
        {#if organization_name || competition?.name}
            <div class="text-center pb-2">
                {#if organization_name}
                    <p
                        class="text-xs uppercase tracking-widest text-gray-400 font-medium"
                    >
                        {organization_name}
                    </p>
                {/if}
                {#if competition?.name}
                    <p class="text-sm font-semibold text-gray-200">
                        {competition.name}
                    </p>
                {/if}
            </div>
        {/if}

        <div class="flex items-center justify-between mb-3">
            <button
                type="button"
                class="p-2 hover:bg-gray-800 rounded-lg"
                on:click={on_back}
                aria-label="Go back"
            >
                <svg
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
            </button>

            <div class="flex items-center gap-2">
                {#if view_state.is_game_in_progress}
                    <span class="relative flex h-2.5 w-2.5">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"
                        ></span>
                    </span>
                {/if}
                <span
                    class="text-xs font-semibold uppercase tracking-wider {get_match_report_status_color(
                        fixture.status,
                    )}"
                >
                    {get_match_report_status_label(fixture.status)}
                </span>
                {#if view_state.is_game_in_progress && fixture.current_period}
                    <span class="text-xs text-gray-500 mx-1">·</span>
                    <span class="text-xs text-gray-400">
                        {get_period_display_name(fixture.current_period)}
                    </span>
                {/if}
            </div>

            <div class="w-10"></div>
        </div>

        <div class="flex items-center gap-4 sm:gap-8 justify-center">
            <div class="text-center flex-1">
                <div class="flex justify-center mb-2">
                    <TeamLogoThumbnail
                        logo_url={home_team ? get_team_logo(home_team) : ""}
                        team_name={home_team?.name ?? "HOME"}
                        size="lg"
                    />
                </div>
                <div
                    class="text-sm sm:text-base font-medium text-gray-300 mb-2 truncate"
                >
                    {home_team?.name ?? "HOME"}
                </div>
                <div class="text-4xl sm:text-5xl font-bold tabular-nums">
                    {#if view_state.is_game_scheduled}
                        <span class="text-gray-500 text-3xl">-</span>
                    {:else}
                        {view_state.home_score}
                    {/if}
                </div>
            </div>

            <div class="text-center px-2">
                {#if view_state.is_game_in_progress}
                    <div class="text-xs text-gray-500 mb-1">
                        {fixture.current_minute ?? 0}'
                    </div>
                {/if}
                <div class="text-lg font-semibold text-gray-500">VS</div>
            </div>

            <div class="text-center flex-1">
                <div class="flex justify-center mb-2">
                    <TeamLogoThumbnail
                        logo_url={away_team ? get_team_logo(away_team) : ""}
                        team_name={away_team?.name ?? "AWAY"}
                        size="lg"
                    />
                </div>
                <div
                    class="text-sm sm:text-base font-medium text-gray-300 mb-2 truncate"
                >
                    {away_team?.name ?? "AWAY"}
                </div>
                <div class="text-4xl sm:text-5xl font-bold tabular-nums">
                    {#if view_state.is_game_scheduled}
                        <span class="text-gray-500 text-3xl">-</span>
                    {:else}
                        {view_state.away_score}
                    {/if}
                </div>
            </div>
        </div>

        {#if view_state.is_game_completed}
            <div class="flex justify-center mt-4">
                <button
                    class="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    disabled={downloading_report}
                    on:click={on_download}
                >
                    {#if downloading_report}
                        <svg
                            class="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Generating...
                    {:else}
                        📄 Download Match Report
                    {/if}
                </button>
            </div>
        {/if}
    </div>
</div>

<div
    class="bg-gray-800 text-gray-300 px-4 py-2 text-center text-sm border-t border-gray-700"
>
    <div
        class="max-w-4xl mx-auto flex items-center justify-center gap-3 flex-wrap"
    >
        {#if competition}
            <span class="font-medium">{competition.name}</span>
            <span class="text-gray-600">·</span>
        {/if}
        <span class="text-gray-400">
            {format_match_report_kickoff_display(
                fixture.scheduled_date,
                fixture.scheduled_time,
            )}
        </span>
        {#if venue}
            <span class="text-gray-600">·</span>
            <span class="text-gray-400">📍 {venue.name}</span>
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
