<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";

    export let live_fixtures: Fixture[];
    export let get_fixture_stage_name: (stage_id: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
</script>

{#if live_fixtures.length === 0}
    <div class="text-center py-8 text-accent-500">
        No games are being played right now.
    </div>
{:else}
    <div class="space-y-3">
        {#each live_fixtures as fixture (fixture.id)}
            {@const stage_name = get_fixture_stage_name(fixture.stage_id || "")}
            <div
                class="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800"
            >
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400"
                        >{stage_name}</span
                    >
                    <span class="flex items-center gap-1.5">
                        <span class="relative flex h-2 w-2"
                            ><span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                            ></span><span
                                class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                            ></span></span
                        >
                        <span
                            class="text-xs font-semibold text-red-600 dark:text-red-400"
                            >LIVE</span
                        >
                    </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 flex items-center justify-end gap-1.5">
                        <span
                            class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                            >{get_team_name(fixture.home_team_id)}</span
                        >
                        <TeamLogoThumbnail
                            logo_url={get_team_logo_url(fixture.home_team_id)}
                            team_name={get_team_name(fixture.home_team_id)}
                            size="sm"
                        />
                    </div>
                    <div
                        class="flex-shrink-0 px-3 sm:px-6 text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-100 tabular-nums"
                    >
                        {fixture.home_team_score ?? 0} - {fixture.away_team_score ??
                            0}
                    </div>
                    <div class="flex-1 flex items-center gap-1.5">
                        <TeamLogoThumbnail
                            logo_url={get_team_logo_url(fixture.away_team_id)}
                            team_name={get_team_name(fixture.away_team_id)}
                            size="sm"
                        />
                        <span
                            class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                            >{get_team_name(fixture.away_team_id)}</span
                        >
                    </div>
                </div>
                <div
                    class="flex justify-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                    <a
                        href={`/live-games/${fixture.id}`}
                        class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >Watch Live</a
                    >
                    <button
                        type="button"
                        class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        on:click={() => on_open_match_report(fixture.id)}
                        >View Details</button
                    >
                </div>
            </div>
        {/each}
    </div>
{/if}
