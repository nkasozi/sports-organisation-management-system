<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import type {
        MatchReportAssignedOfficialData,
        MatchReportTeamState,
        MatchReportVenueState,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import type { MatchReportViewState } from "$lib/presentation/logic/matchReportPageState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

    import LiveGameCorrectionLog from "../game/LiveGameCorrectionLog.svelte";
    import LiveGameViewerStats from "../game/LiveGameViewerStats.svelte";
    import MatchReportLineupCard from "./MatchReportLineupCard.svelte";
    import MatchReportMetadataPanel from "./MatchReportMetadataPanel.svelte";
    import MatchReportScheduledNotice from "./MatchReportScheduledNotice.svelte";
    import MatchReportTimeline from "./MatchReportTimeline.svelte";

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
    export let home_team_state: MatchReportTeamState = {
        status: PRESENCE_STATUS.MISSING,
    };
    export let away_team_state: MatchReportTeamState = {
        status: PRESENCE_STATUS.MISSING,
    };
    export let venue_state: MatchReportVenueState = {
        status: PRESENCE_STATUS.MISSING,
    };
    export let assigned_officials_data: MatchReportAssignedOfficialData[] = [];
    export let home_players: LineupPlayer[] = [];
    export let away_players: LineupPlayer[] = [];
    export let view_state: MatchReportViewState =
        default_match_report_view_state;

    $: missing_lineup_teams = [
        home_players.length === 0
            ? home_team_state.status === PRESENCE_STATUS.PRESENT
                ? home_team_state.team.name
                : "the home team"
            : "",
        away_players.length === 0
            ? away_team_state.status === PRESENCE_STATUS.PRESENT
                ? away_team_state.team.name
                : "the away team"
            : "",
    ].filter(Boolean);
</script>

<div class="flex-1 p-4">
    <div class="max-w-3xl mx-auto">
        {#if view_state.is_game_scheduled}
            <MatchReportScheduledNotice {fixture} {venue_state} />
        {/if}

        {#if view_state.is_game_completed && missing_lineup_teams.length > 0}
            <div
                role="status"
                class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
                <p class="font-semibold">Can't generate a full match report</p>
                <p class="mt-1 text-sm">
                    Missing match lineups for {missing_lineup_teams.join(
                        " and ",
                    )}.
                </p>
            </div>
        {/if}

        {#if view_state.has_lineups || view_state.is_game_scheduled || view_state.is_game_in_progress || view_state.is_game_completed}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <MatchReportLineupCard
                    team_name={home_team_state.status ===
                    PRESENCE_STATUS.PRESENT
                        ? home_team_state.team.name
                        : "Home"}
                    players={home_players}
                    variant="home"
                />
                <MatchReportLineupCard
                    team_name={away_team_state.status ===
                    PRESENCE_STATUS.PRESENT
                        ? away_team_state.team.name
                        : "Away"}
                    players={away_players}
                    variant="away"
                />
            </div>
        {/if}

        <MatchReportMetadataPanel
            {fixture}
            {home_team_state}
            {away_team_state}
            {venue_state}
            {assigned_officials_data}
        />

        {#if !view_state.is_game_scheduled}
            <MatchReportTimeline
                events={view_state.sorted_events}
                is_game_in_progress={view_state.is_game_in_progress}
                home_team_name={home_team_state.status ===
                PRESENCE_STATUS.PRESENT
                    ? home_team_state.team.name
                    : "Home"}
                away_team_name={away_team_state.status ===
                PRESENCE_STATUS.PRESENT
                    ? away_team_state.team.name
                    : "Away"}
            />
            <div class="px-4 sm:px-6 pb-6">
                <LiveGameCorrectionLog
                    corrections={fixture.event_corrections ?? []}
                />
            </div>
        {/if}

        {#if view_state.is_game_completed && fixture.id}
            <div class="px-4 sm:px-6 pb-6">
                <LiveGameViewerStats fixture_id={fixture.id} />
            </div>
        {/if}
    </div>
</div>
