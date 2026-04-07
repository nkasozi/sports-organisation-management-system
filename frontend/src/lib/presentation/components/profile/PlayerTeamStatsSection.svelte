<script lang="ts">
    import type { PlayerPublicTeamStats } from "$lib/presentation/logic/playerPublicProfilePageState";

    export let team_stats: PlayerPublicTeamStats[];
</script>

{#if team_stats.length > 0}
    <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
    >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Team Statistics
        </h2>

        <div class="space-y-4">
            {#each team_stats as current_team_stat}
                <div
                    class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                >
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3
                                class="font-semibold text-gray-900 dark:text-white"
                            >
                                {current_team_stat.team.name}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                #{current_team_stat.membership.jersey_number} • Since
                                {new Date(
                                    current_team_stat.membership.start_date,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        <span
                            class="px-3 py-1 text-xs font-medium rounded-full {current_team_stat
                                .membership.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
                        >
                            {current_team_stat.membership.status}
                        </span>
                    </div>

                    <div class="grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                            <p class="font-bold text-gray-900 dark:text-white">
                                {current_team_stat.stats.total_matches}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Matches
                            </p>
                        </div>
                        <div>
                            <p
                                class="font-bold text-green-600 dark:text-green-400"
                            >
                                {current_team_stat.stats.goals}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Goals
                            </p>
                        </div>
                        <div>
                            <p
                                class="font-bold text-blue-600 dark:text-blue-400"
                            >
                                {current_team_stat.stats.assists}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Assists
                            </p>
                        </div>
                        <div>
                            <p
                                class="font-bold text-violet-600 dark:text-violet-400"
                            >
                                {current_team_stat.stats.yellow_cards}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Cards
                            </p>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </section>
{/if}
