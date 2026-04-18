<script lang="ts">
    import type {
        CardSortMode,
        PlayerStats,
    } from "$lib/presentation/logic/competitionResultsStats";

    export let stats_team_filter: string;
    export let stats_available_teams: string[];
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
            <option value="all">All Teams</option>
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
                <span>⚽</span> Top Scorers
            </h3>
            {#if stats_filtered_scorers.length === 0}
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    {stats_team_filter === "all"
                        ? "No goals scored yet."
                        : `No goals scored by ${stats_team_filter} yet.`}
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
                                >{player.goals}</span
                            >
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"
            >
                <h3
                    class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 flex items-center gap-2"
                >
                    <span>🟨</span> Most Cards
                </h3>
                <div
                    class="flex rounded-md border border-accent-200 dark:border-accent-700 overflow-hidden text-xs font-medium self-start sm:self-auto"
                >
                    <button
                        type="button"
                        class={`px-2.5 py-1.5 transition-colors ${stats_card_sort === "total" ? "bg-theme-primary-500 text-white" : "bg-white dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-700"}`}
                        on:click={() => (stats_card_sort = "total")}>All</button
                    >
                    <button
                        type="button"
                        class={`px-2.5 py-1.5 border-l border-accent-200 dark:border-accent-700 transition-colors flex items-center gap-1 ${stats_card_sort === "yellow" ? "bg-theme-primary-500 text-white" : "bg-white dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-700"}`}
                        on:click={() => (stats_card_sort = "yellow")}
                        ><span
                            class="w-2 h-3 bg-yellow-400 rounded-sm inline-block"
                        ></span> Yellow</button
                    >
                    <button
                        type="button"
                        class={`px-2.5 py-1.5 border-l border-accent-200 dark:border-accent-700 transition-colors flex items-center gap-1 ${stats_card_sort === "red" ? "bg-theme-primary-500 text-white" : "bg-white dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-700"}`}
                        on:click={() => (stats_card_sort = "red")}
                        ><span
                            class="w-2 h-3 bg-red-500 rounded-sm inline-block"
                        ></span> Red</button
                    >
                </div>
            </div>
            {#if stats_filtered_card_players.length === 0}
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    {stats_team_filter === "all"
                        ? "No cards issued yet."
                        : `No cards issued to ${stats_team_filter} players yet.`}
                </div>
            {:else}
                <div class="space-y-2">
                    {#each stats_filtered_card_players as player, index}
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
                            <div class="flex gap-2 sm:gap-3 ml-2">
                                {#if player.yellow_cards > 0}
                                    <span class="flex items-center gap-1"
                                        ><span
                                            class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-yellow-400 rounded-sm"
                                        ></span><span
                                            class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >{player.yellow_cards}</span
                                        ></span
                                    >
                                {/if}
                                {#if player.red_cards > 0}
                                    <span class="flex items-center gap-1"
                                        ><span
                                            class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-red-500 rounded-sm"
                                        ></span><span
                                            class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >{player.red_cards}</span
                                        ></span
                                    >
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
