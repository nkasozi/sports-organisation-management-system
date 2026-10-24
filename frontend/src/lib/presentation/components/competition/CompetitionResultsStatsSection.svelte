<script lang="ts">
    import type {
        CardSortMode,
        CardStatCategory,
        PlayerStats,
    } from "$lib/presentation/logic/competitionResultsCardStats";

    import CompetitionResultsCardLeaders from "./CompetitionResultsCardLeaders.svelte";
    import { COMPETITION_STATS_ALL_TEAMS_FILTER } from "./competitionResultsDisplayConstants";

    export let stats_team_filter: string;
    export let stats_available_teams: string[];
    export let stats_card_categories: CardStatCategory[];
    export let stats_card_sort: CardSortMode;
    export let stats_filtered_scorers: PlayerStats[];
    export let stats_filtered_card_players: PlayerStats[];
</script>

<div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span
            class="text-sm font-medium text-accent-600 dark:text-accent-400 shrink-0"
            >Filter by team:</span
        >
        <select
            bind:value={stats_team_filter}
            class="text-sm rounded-[0.175rem] border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 px-3 py-1.5 focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent w-full sm:w-auto sm:max-w-xs"
        >
            <option value={COMPETITION_STATS_ALL_TEAMS_FILTER}>All Teams</option
            >
            {#each stats_available_teams as team_name}
                <option value={team_name}>{team_name}</option>
            {/each}
        </select>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3
                class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
            >
                <span>🏅</span> Top Scorers
            </h3>
            {#if stats_filtered_scorers.length === 0}
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    {stats_team_filter === COMPETITION_STATS_ALL_TEAMS_FILTER
                        ? "No scores recorded yet."
                        : `No scores recorded for ${stats_team_filter} yet.`}
                </div>
            {:else}
                <div class="space-y-2">
                    {#each stats_filtered_scorers as player, index}
                        <div
                            class="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg"
                        >
                            <div
                                class="flex items-center gap-2 sm:gap-3 min-w-0"
                            >
                                <span
                                    class={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold rounded-full ${index < 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                                    >{index + 1}</span
                                >
                                <div class="min-w-0">
                                    <div
                                        class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                                    >
                                        {player.player_name}
                                    </div>
                                    <div
                                        class="text-xs text-gray-500 dark:text-gray-400 truncate"
                                    >
                                        {player.team_name}
                                    </div>
                                </div>
                            </div>
                            <span
                                class="text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-100 ml-2"
                                >{player.points}</span
                            >
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <CompetitionResultsCardLeaders
            {stats_team_filter}
            {stats_card_categories}
            bind:stats_card_sort
            {stats_filtered_card_players}
        />
    </div>
</div>
