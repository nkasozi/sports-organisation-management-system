<script lang="ts">
    import type { GameEvent } from "$lib/core/entities/Fixture";
    import {
        format_event_time,
        get_event_icon,
        get_event_label,
    } from "$lib/core/entities/Fixture";
    import { get_match_report_event_bg_class } from "$lib/presentation/logic/matchReportPageState";

    export let events: GameEvent[];
    export let is_game_in_progress: boolean;
    export let home_team_name: string;
    export let away_team_name: string;
</script>

<div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-blue-500"></span>
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >{home_team_name}</span
        >
    </div>
    <h3
        class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
    >
        Match Timeline
    </h3>
    <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >{away_team_name}</span
        >
        <span class="w-3 h-3 rounded-full bg-red-500"></span>
    </div>
</div>

{#if events.length === 0}
    <div class="text-center py-16">
        <div
            class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
            <span class="text-4xl">📋</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Events Yet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
            {#if is_game_in_progress}
                Waiting for match events to be recorded
            {:else}
                This match had no recorded events
            {/if}
        </p>
    </div>
{:else}
    <div class="relative">
        <div
            class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2"
        ></div>
        <div class="space-y-4">
            {#each events as event}
                {@const is_home_event = event.team_side === "home"}
                {@const is_match_event = event.team_side === "match"}
                {#if is_match_event}
                    <div class="relative flex items-center justify-center">
                        <div class="flex flex-col items-center">
                            <div
                                class="z-10 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-purple-400 dark:border-purple-600 flex items-center justify-center text-xl"
                            >
                                {get_event_icon(event.event_type)}
                            </div>
                            <div
                                class="mt-2 text-center py-3 px-4 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800"
                            >
                                <div
                                    class="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1"
                                >
                                    {format_event_time(
                                        event.minute,
                                        event.stoppage_time_minute,
                                    )}
                                </div>
                                <div
                                    class="text-sm font-medium text-purple-800 dark:text-purple-200"
                                >
                                    {event.description ||
                                        get_event_label(event.event_type)}
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="relative flex items-center">
                        <div
                            class="absolute left-1/2 transform -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 {is_home_event
                                ? 'border-blue-400'
                                : 'border-red-400'} flex items-center justify-center text-lg shadow-sm"
                        >
                            {get_event_icon(event.event_type)}
                        </div>
                        {#if is_home_event}
                            <div class="flex-1 pr-8 flex justify-end">
                                <div
                                    class="max-w-xs w-full rounded-lg border-r-4 p-3 shadow-sm text-right {get_match_report_event_bg_class(
                                        event,
                                    ).replace('border-l-', 'border-r-')}"
                                >
                                    <div
                                        class="flex items-center justify-end gap-2 mb-1"
                                    >
                                        <span
                                            class="font-semibold text-gray-900 dark:text-white text-sm"
                                        >
                                            {event.description ||
                                                get_event_label(
                                                    event.event_type,
                                                )}
                                        </span>
                                        <span
                                            class="text-sm font-bold text-blue-600 dark:text-blue-400"
                                        >
                                            {format_event_time(
                                                event.minute,
                                                event.stoppage_time_minute,
                                            )}
                                        </span>
                                    </div>
                                    {#if event.player_name}
                                        <p
                                            class="text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            {event.player_name}{event.secondary_player_name
                                                ? ` → ${event.secondary_player_name}`
                                                : ""}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                            <div class="flex-1 pl-8"></div>
                        {:else}
                            <div class="flex-1 pr-8"></div>
                            <div class="flex-1 pl-8 flex justify-start">
                                <div
                                    class="max-w-xs w-full rounded-lg border-l-4 p-3 shadow-sm text-left {get_match_report_event_bg_class(
                                        event,
                                    )}"
                                >
                                    <div
                                        class="flex items-center justify-start gap-2 mb-1"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-600 dark:text-red-400"
                                        >
                                            {format_event_time(
                                                event.minute,
                                                event.stoppage_time_minute,
                                            )}
                                        </span>
                                        <span
                                            class="font-semibold text-gray-900 dark:text-white text-sm"
                                        >
                                            {event.description ||
                                                get_event_label(
                                                    event.event_type,
                                                )}
                                        </span>
                                    </div>
                                    {#if event.player_name}
                                        <p
                                            class="text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            {event.player_name}{event.secondary_player_name
                                                ? ` → ${event.secondary_player_name}`
                                                : ""}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </div>
{/if}
