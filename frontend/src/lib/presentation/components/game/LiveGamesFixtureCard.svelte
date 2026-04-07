<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";
    import {
        format_live_game_date_time,
        get_live_game_status_badge_class,
    } from "$lib/presentation/logic/liveGamesViewLogic";

    import LiveGamesFixtureActions from "./LiveGamesFixtureActions.svelte";
    import LiveGamesPreFlightChecks from "./LiveGamesPreFlightChecks.svelte";

    export let fixture: Fixture;
    export let home_team_name: string;
    export let away_team_name: string;
    export let home_team_logo_url: string;
    export let away_team_logo_url: string;
    export let competition_name: string;
    export let sport_name: string;
    export let can_start_games: boolean;
    export let is_starting: boolean;
    export let checks: PreFlightCheck[] = [];
    export let on_start_click: (fixture: Fixture) => void;
</script>

<div
    class="bg-white dark:bg-accent-800 rounded-xl shadow-sm border border-accent-200 dark:border-accent-700 overflow-hidden"
>
    <div class="p-4 sm:p-5">
        <div class="flex flex-col gap-4">
            <div class="pb-4 border-b border-accent-200 dark:border-accent-700">
                <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
                >
                    <span
                        class="text-base sm:text-lg font-semibold text-accent-900 dark:text-white line-clamp-1 text-center sm:text-left sm:flex-1"
                    >
                        {home_team_name}
                    </span>
                    <div
                        class="flex items-center justify-center gap-2 shrink-0"
                    >
                        <TeamLogoThumbnail
                            logo_url={home_team_logo_url}
                            team_name={home_team_name}
                            size="sm"
                        />
                        {#if fixture.status === "in_progress"}
                            <span
                                class="text-lg sm:text-xl font-bold text-accent-900 dark:text-white tabular-nums"
                            >
                                {fixture.home_team_score ?? 0} - {fixture.away_team_score ??
                                    0}
                            </span>
                        {:else}
                            <span
                                class="text-accent-400 dark:text-accent-500 font-normal text-base sm:text-lg"
                            >
                                vs
                            </span>
                        {/if}
                        <TeamLogoThumbnail
                            logo_url={away_team_logo_url}
                            team_name={away_team_name}
                            size="sm"
                        />
                    </div>
                    <span
                        class="text-base sm:text-lg font-semibold text-accent-900 dark:text-white line-clamp-1 text-center sm:text-right sm:flex-1"
                    >
                        {away_team_name}
                    </span>
                </div>
            </div>

            <div class="mb-2">
                <span class={get_live_game_status_badge_class(fixture.status)}>
                    {fixture.status.replace("_", " ")}
                </span>
            </div>

            <div
                class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 text-sm"
            >
                <div class="flex flex-col gap-2 sm:flex-1">
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            ></path>
                        </svg>
                        <span
                            class="text-accent-600 dark:text-accent-400 truncate"
                        >
                            {competition_name}
                        </span>
                    </div>

                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-sky-500 dark:text-sky-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            ></path>
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <span class="text-accent-600 dark:text-accent-400"
                            >{sport_name}</span
                        >
                    </div>
                </div>

                <div class="hidden sm:block sm:flex-1"></div>

                <div class="flex flex-col gap-2 sm:flex-1 sm:items-end">
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                        </svg>
                        <span class="text-accent-600 dark:text-accent-400">
                            {format_live_game_date_time(fixture.scheduled_date)}
                        </span>
                    </div>

                    {#if fixture.venue}
                        <div class="flex items-center gap-2">
                            <svg
                                class="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                ></path>
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                ></path>
                            </svg>
                            <span
                                class="text-accent-600 dark:text-accent-400 truncate"
                            >
                                {fixture.venue}
                            </span>
                        </div>
                    {/if}
                </div>
            </div>

            <LiveGamesFixtureActions
                {fixture}
                {can_start_games}
                {is_starting}
                {on_start_click}
            />
        </div>
    </div>

    <LiveGamesPreFlightChecks {checks} />
</div>
