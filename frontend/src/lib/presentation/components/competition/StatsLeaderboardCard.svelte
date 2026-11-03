<script lang="ts">
    import type { CardStatCategory } from "$lib/presentation/logic/competitionResultsCardStats";
    import type { PlayerStatMomentKind } from "$lib/presentation/logic/competitionResultsPlayerMoments";
    import type { PlayerStats } from "$lib/presentation/logic/competitionResultsStats";

    import StatsLeaderboardRow from "./StatsLeaderboardRow.svelte";
    import StatsPlayerGames from "./StatsPlayerGames.svelte";

    export let title: string;
    export let icon: string;
    export let empty_message: string;
    export let players: PlayerStats[];
    export let read_value: (player: PlayerStats) => number;
    export let kind: PlayerStatMomentKind;
    export let card_categories: CardStatCategory[];
    export let format_date: (date_string: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    let expanded_player_key = "";

    function toggle_player(player_key: string): string {
        expanded_player_key =
            expanded_player_key === player_key ? "" : player_key;
        return expanded_player_key;
    }
</script>

<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <h3
        class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
    >
        <span>{icon}</span>
        {title}
    </h3>
    {#if players.length === 0}
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
            {empty_message}
        </div>
    {:else}
        <div class="space-y-2">
            {#each players as player, index (player.player_key)}
                <StatsLeaderboardRow
                    rank={index + 1}
                    {player}
                    is_expanded={expanded_player_key === player.player_key}
                    on_toggle={toggle_player}
                >
                    <span
                        slot="value"
                        class="text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-100"
                        >{read_value(player)}</span
                    >
                    <StatsPlayerGames
                        slot="details"
                        {player}
                        {kind}
                        {card_categories}
                        {format_date}
                        {get_team_name}
                        {on_open_match_report}
                    />
                </StatsLeaderboardRow>
            {/each}
        </div>
    {/if}
</div>
