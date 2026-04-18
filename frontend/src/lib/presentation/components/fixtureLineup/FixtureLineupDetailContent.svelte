<script lang="ts">
    import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import type {
        FixtureLineupDetailFixtureState,
        FixtureLineupDetailTeamState,
    } from "$lib/presentation/logic/fixtureLineupDetailPageContracts";

    import FixtureLineupDetailSummary from "./FixtureLineupDetailSummary.svelte";
    import FixtureLineupPlayerSection from "./FixtureLineupPlayerSection.svelte";

    export let lineup: FixtureLineup;
    export let fixture_state: FixtureLineupDetailFixtureState;
    export let team_state: FixtureLineupDetailTeamState;
    export let team_players: TeamPlayer[];
    export let home_team_state: FixtureLineupDetailTeamState;
    export let away_team_state: FixtureLineupDetailTeamState;
    export let can_modify_lineup: boolean;
    export let permission_info_message: string;
    export let selected_player_ids: Set<string>;
    export let saving: boolean;
    export let on_toggle_player_selection: (player_id: string) => void;
    export let on_back: () => void;
    export let on_save: () => void | Promise<void>;
    export let on_submit: () => void | Promise<void>;
</script>

<div class="space-y-6">
    <FixtureLineupDetailSummary
        {lineup}
        {fixture_state}
        {team_state}
        {home_team_state}
        {away_team_state}
        {permission_info_message}
    />

    <FixtureLineupPlayerSection
        {lineup}
        {team_players}
        {can_modify_lineup}
        {selected_player_ids}
        {saving}
        {on_toggle_player_selection}
        {on_back}
        {on_save}
        {on_submit}
    />
</div>
