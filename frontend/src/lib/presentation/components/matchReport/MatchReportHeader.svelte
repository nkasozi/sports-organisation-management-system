<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import { get_period_display_name } from "$lib/core/entities/Fixture";
    import { get_team_logo } from "$lib/core/entities/Team";
    import MatchReportHeaderTeam from "$lib/presentation/components/matchReport/MatchReportHeaderTeam.svelte";
    import type {
        MatchReportCompetitionState,
        MatchReportTeamState,
        MatchReportVenueState,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import {
        format_match_report_kickoff_display,
        get_match_report_status_color,
        get_match_report_status_label,
        type MatchReportViewState,
    } from "$lib/presentation/logic/matchReportPageState";

    const default_match_report_view_state: MatchReportViewState = {
        home_score: 0,
        away_score: 0,
        sorted_events: [],
        home_starters: [],
        home_substitutes: [],
        away_starters: [],
        away_substitutes: [],
        is_game_scheduled: false,
        is_game_in_progress: false,
        is_game_completed: false,
        has_lineups: false,
    };

    export let fixture: Fixture = {} as Fixture;
    export let home_team_state: MatchReportTeamState = { status: "missing" };
    export let away_team_state: MatchReportTeamState = { status: "missing" };
    export let competition_state: MatchReportCompetitionState = {
        status: "missing",
    };
    export let organization_name = "";
    export let venue_state: MatchReportVenueState = { status: "missing" };
    export let view_state: MatchReportViewState = default_match_report_view_state;
    export let live_poll_interval_ms = 0;
    export let downloading_report = false;
    export let on_back: () => void = () => {};
    export let on_download: () => void = () => {};
</script>

<div class="bg-gray-900 text-white px-4 py-4 sticky top-0 z-40">
    <div class="max-w-4xl mx-auto">
        {#if organization_name || competition_state.status === "present"}
            <div class="text-center pb-2">
                {#if organization_name}
                    <p
                        class="text-xs uppercase tracking-widest text-gray-400 font-medium"
                    >
                        {organization_name}
                    </p>
                {/if}
                {#if competition_state.status === "present"}
                    <p class="text-sm font-semibold text-gray-200">
                        {competition_state.competition.name}
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
            <MatchReportHeaderTeam
                team_logo_url={home_team_state.status === "present"
                    ? get_team_logo(home_team_state.team)
                    : ""}
                team_name={home_team_state.status === "present"
                    ? home_team_state.team.name
                    : "HOME"}
                score={view_state.home_score}
                is_game_scheduled={view_state.is_game_scheduled}
            />
            <div class="text-center px-2">
                {#if view_state.is_game_in_progress}
                    <div class="text-xs text-gray-500 mb-1">
                        {fixture.current_minute ?? 0}'
                    </div>
                {/if}
                <div class="text-lg font-semibold text-gray-500">VS</div>
            </div>

            <MatchReportHeaderTeam
                team_logo_url={away_team_state.status === "present"
                    ? get_team_logo(away_team_state.team)
                    : ""}
                team_name={away_team_state.status === "present"
                    ? away_team_state.team.name
                    : "AWAY"}
                score={view_state.away_score}
                is_game_scheduled={view_state.is_game_scheduled}
            />
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
            {#if competition_state.status === "present"}
                <span class="font-medium">{competition_state.competition.name}</span>
            <span class="text-gray-600">·</span>
        {/if}
        <span class="text-gray-400">
            {format_match_report_kickoff_display(
                fixture.scheduled_date,
                fixture.scheduled_time,
            )}
        </span>
            {#if venue_state.status === "present"}
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
