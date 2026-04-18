<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import type {
        MatchReportAssignedOfficialData,
        MatchReportTeamState,
        MatchReportVenueState,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import type { MatchReportViewState } from "$lib/presentation/logic/matchReportPageState";

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
    export let home_team_state: MatchReportTeamState = { status: "missing" };
    export let away_team_state: MatchReportTeamState = { status: "missing" };
    export let venue_state: MatchReportVenueState = { status: "missing" };
    export let assigned_officials_data: MatchReportAssignedOfficialData[] = [];
    export let home_players: LineupPlayer[] = [];
    export let away_players: LineupPlayer[] = [];
    export let view_state: MatchReportViewState = default_match_report_view_state;
</script>

<div class="flex-1 p-4">
    <div class="max-w-3xl mx-auto">
        {#if view_state.is_game_scheduled}
            <MatchReportScheduledNotice {fixture} {venue_state} />
        {/if}

        {#if view_state.has_lineups || view_state.is_game_scheduled || view_state.is_game_in_progress}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <MatchReportLineupCard
                    team_name={home_team_state.status === "present"
                        ? home_team_state.team.name
                        : "Home"}
                    players={home_players}
                    variant="home"
                />
                <MatchReportLineupCard
                    team_name={away_team_state.status === "present"
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
                home_team_name={home_team_state.status === "present"
                    ? home_team_state.team.name
                    : "Home"}
                away_team_name={away_team_state.status === "present"
                    ? away_team_state.team.name
                    : "Away"}
            />
        {/if}
    </div>
</div>
