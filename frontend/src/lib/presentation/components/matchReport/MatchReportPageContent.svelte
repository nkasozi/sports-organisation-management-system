<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import type { Team } from "$lib/core/entities/Team";
    import type { Venue } from "$lib/core/entities/Venue";
    import type { MatchReportAssignedOfficialData } from "$lib/presentation/logic/matchReportPageLoad";
    import type { MatchReportViewState } from "$lib/presentation/logic/matchReportPageState";

    import MatchReportLineupCard from "./MatchReportLineupCard.svelte";
    import MatchReportMetadataPanel from "./MatchReportMetadataPanel.svelte";
    import MatchReportScheduledNotice from "./MatchReportScheduledNotice.svelte";
    import MatchReportTimeline from "./MatchReportTimeline.svelte";

    export let fixture: Fixture;
    export let home_team: Team | null;
    export let away_team: Team | null;
    export let venue: Venue | null;
    export let assigned_officials_data: MatchReportAssignedOfficialData[];
    export let home_players: LineupPlayer[];
    export let away_players: LineupPlayer[];
    export let view_state: MatchReportViewState;
</script>

<div class="flex-1 p-4">
    <div class="max-w-3xl mx-auto">
        {#if view_state.is_game_scheduled}
            <MatchReportScheduledNotice {fixture} {venue} />
        {/if}

        {#if view_state.has_lineups || view_state.is_game_scheduled || view_state.is_game_in_progress}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <MatchReportLineupCard
                    team_name={home_team?.name ?? "Home"}
                    players={home_players}
                    variant="home"
                />
                <MatchReportLineupCard
                    team_name={away_team?.name ?? "Away"}
                    players={away_players}
                    variant="away"
                />
            </div>
        {/if}

        <MatchReportMetadataPanel
            {fixture}
            {home_team}
            {away_team}
            {venue}
            {assigned_officials_data}
        />

        {#if !view_state.is_game_scheduled}
            <MatchReportTimeline
                events={view_state.sorted_events}
                is_game_in_progress={view_state.is_game_in_progress}
                home_team_name={home_team?.name ?? "Home"}
                away_team_name={away_team?.name ?? "Away"}
            />
        {/if}
    </div>
</div>
