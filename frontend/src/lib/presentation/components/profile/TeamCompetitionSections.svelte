<script lang="ts">
    import type { Team } from "$lib/core/entities/Team";
    import {
        build_team_public_profile_fixture_display,
        type CompetitionPublicProfileStats,
        format_team_public_profile_date,
    } from "$lib/presentation/logic/teamPublicProfilePageState";

    export let competition_stats: CompetitionPublicProfileStats[];
    export let teams_map: Map<string, Team>;
</script>

{#if competition_stats.length > 0}
    {#each competition_stats as competition_stat (competition_stat.competition.id)}
        <section
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
        >
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {competition_stat.competition.name}
            </h2>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                    class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center"
                >
                    <div
                        class="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400"
                    >
                        {competition_stat.stats.total_matches}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Matches
                    </div>
                </div>
                <div
                    class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center"
                >
                    <div
                        class="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400"
                    >
                        {competition_stat.stats.wins}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Wins
                    </div>
                </div>
                <div
                    class="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-4 text-center"
                >
                    <div
                        class="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400"
                    >
                        {competition_stat.stats.draws}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Draws
                    </div>
                </div>
                <div
                    class="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 text-center"
                >
                    <div
                        class="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400"
                    >
                        {competition_stat.stats.losses}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Losses
                    </div>
                </div>
            </div>

            {#if competition_stat.upcoming_fixtures.length > 0}
                <div>
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
                    >
                        Upcoming Fixtures
                    </h3>
                    <div class="space-y-3">
                        {#each competition_stat.upcoming_fixtures as fixture (fixture.id)}
                            <div
                                class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                            >
                                <div class="flex-1">
                                    <div
                                        class="text-sm font-medium text-gray-900 dark:text-white"
                                    >
                                        {build_team_public_profile_fixture_display(
                                            fixture,
                                            teams_map,
                                        )}
                                    </div>
                                    <div
                                        class="text-xs text-gray-600 dark:text-gray-400 mt-1"
                                    >
                                        {format_team_public_profile_date(
                                            fixture.scheduled_date,
                                        )}
                                        {#if fixture.venue}
                                            • {fixture.venue}
                                        {/if}
                                    </div>
                                </div>
                                <div
                                    class="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                                >
                                    {fixture.status}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </section>
    {/each}
{/if}
