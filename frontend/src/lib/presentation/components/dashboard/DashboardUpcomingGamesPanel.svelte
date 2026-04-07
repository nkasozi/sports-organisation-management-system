<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import { format_fixture_date } from "$lib/presentation/logic/dashboardPageLogic";

    export let loading: boolean;
    export let upcoming_fixtures: Fixture[];
    export let user_has_org_admin_access: boolean;
    export let get_team_name: (team_id: string) => string;
    export let get_competition_name: (competition_id: string) => string;
    export let get_sport_name: (competition_id: string) => string;
</script>

<div class="card p-6">
    <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
        Upcoming Games
    </h2>
    <div class="space-y-4">
        {#if loading}
            {#each Array(3) as _}
                <div class="animate-pulse">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div
                                class="h-8 w-8 bg-accent-200 dark:bg-accent-700 rounded"
                            ></div>
                            <div class="space-y-1">
                                <div
                                    class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-20"
                                ></div>
                                <div
                                    class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-16"
                                ></div>
                            </div>
                        </div>
                        <div
                            class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-16"
                        ></div>
                    </div>
                </div>
            {/each}
        {:else if upcoming_fixtures.length === 0}
            <div class="text-center py-4">
                <p class="text-sm text-accent-500 dark:text-accent-400">
                    No upcoming fixtures.
                    {#if user_has_org_admin_access}
                        <a
                            href="/fixtures?action=create"
                            class="text-primary-500 hover:underline"
                            >Schedule one</a
                        >
                    {/if}
                </p>
            </div>
        {:else}
            {#each upcoming_fixtures as fixture, index}
                <svelte:element
                    this={user_has_org_admin_access ? "a" : "div"}
                    href={user_has_org_admin_access ? "/live-games" : undefined}
                    class="flex items-center justify-between p-2 -mx-2 rounded-lg {user_has_org_admin_access
                        ? 'hover:bg-accent-50 dark:hover:bg-accent-700/50 cursor-pointer'
                        : ''} transition-colors"
                >
                    <div class="flex items-center space-x-3">
                        <div
                            class="h-8 w-8 rounded flex items-center justify-center {index %
                                3 ===
                            0
                                ? 'bg-sky-100 dark:bg-sky-900/60'
                                : index % 3 === 1
                                  ? 'bg-teal-100 dark:bg-teal-900/60'
                                  : 'bg-fuchsia-100 dark:bg-fuchsia-900/60'}"
                        >
                            <svg
                                class="h-4 w-4 {index % 3 === 0
                                    ? 'text-sky-500'
                                    : index % 3 === 1
                                      ? 'text-teal-500'
                                      : 'text-fuchsia-500'}"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-accent-900 dark:text-accent-100"
                            >
                                {get_team_name(fixture.home_team_id)} vs {get_team_name(
                                    fixture.away_team_id,
                                )}
                            </p>
                            <div class="flex flex-col gap-1 mt-0.5">
                                <span
                                    class="inline-flex items-center px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded text-xs w-fit"
                                >
                                    {get_competition_name(
                                        fixture.competition_id,
                                    )}
                                </span>
                                <span
                                    class="inline-flex items-center px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded text-xs w-fit"
                                >
                                    {get_sport_name(fixture.competition_id)}
                                </span>
                                <p
                                    class="text-xs text-accent-500 dark:text-accent-400 mt-0.5 pl-1"
                                >
                                    {format_fixture_date(
                                        fixture.scheduled_date,
                                        fixture.scheduled_time,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <span class="text-xs text-accent-500 dark:text-accent-400"
                        >{fixture.venue || "TBD"}</span
                    >
                </svelte:element>
            {/each}
        {/if}
    </div>
</div>
