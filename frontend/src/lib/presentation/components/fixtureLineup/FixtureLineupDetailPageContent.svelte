<script lang="ts">
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import FixtureLineupDetailContent from "$lib/presentation/components/fixtureLineup/FixtureLineupDetailContent.svelte";
    import type {
        FixtureLineupDetailFixtureState,
        FixtureLineupDetailLineupState,
        FixtureLineupDetailTeamState,
    } from "$lib/presentation/logic/fixtureLineupDetailPageContracts";

    export let loading: boolean;
    export let error_message: string;
    export let lineup_state: FixtureLineupDetailLineupState;
    export let fixture_state: FixtureLineupDetailFixtureState;
    export let team_state: FixtureLineupDetailTeamState;
    export let team_players: TeamPlayer[];
    export let home_team_state: FixtureLineupDetailTeamState;
    export let away_team_state: FixtureLineupDetailTeamState;
    export let can_modify_lineup: boolean;
    export let permission_info_message: string;
    export let selected_player_ids: string[];
    export let saving: boolean;
    export let on_toggle_player_selection: (player_id: string) => void;
    export let on_back: () => void;
    export let on_save: () => Promise<void>;
    export let on_submit: () => Promise<void>;
</script>

<div class="space-y-6">
    {#if loading}
        <div class="flex justify-center items-center py-12">
            <div class="loading-spinner"></div>
        </div>
    {:else if error_message}
        <div
            class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
        >
            <p class="text-red-600 dark:text-red-400">{error_message}</p>
        </div>
    {:else if lineup_state.status === "present"}
        <FixtureLineupDetailContent
            lineup={lineup_state.lineup}
            {fixture_state}
            {team_state}
            {team_players}
            {home_team_state}
            {away_team_state}
            {can_modify_lineup}
            {permission_info_message}
            selected_player_ids={new Set(selected_player_ids)}
            {saving}
            {on_toggle_player_selection}
            {on_back}
            {on_save}
            {on_submit}
        />
    {/if}
</div>
