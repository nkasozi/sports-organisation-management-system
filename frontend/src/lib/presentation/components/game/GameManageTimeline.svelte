<script lang="ts">
    import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
    import {
        format_event_time,
        get_event_icon,
        get_event_label,
    } from "$lib/core/entities/Fixture";
    import type { EventCorrectionRecord } from "$lib/core/entities/FixtureEventCorrections";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
    import type { LiveGameCorrectionAccess } from "$lib/presentation/logic/liveGameCorrectionAccess";
    import type { LiveEventCorrectionRequest } from "$lib/presentation/logic/liveGameEventCorrection";

    import { GAME_EVENT_TEAM_SIDE } from "./gameDisplayConstants";
    import GameTimelineTeamEvent from "./GameTimelineTeamEvent.svelte";
    import LiveGameCorrectionLog from "./LiveGameCorrectionLog.svelte";
    import LiveGameEditAllowanceBar from "./LiveGameEditAllowanceBar.svelte";

    export let sorted_events: GameEvent[];
    export let fixture_status: Fixture["status"];
    export let is_game_active: boolean;
    export let home_team_name: string;
    export let away_team_name: string;
    export let correction_access: LiveGameCorrectionAccess;
    export let corrections: EventCorrectionRecord[] = [];
    export let on_reset_edits: () => Promise<boolean>;
    export let home_players: LineupPlayer[];
    export let away_players: LineupPlayer[];
    export let on_correct: (
        request: LiveEventCorrectionRequest,
    ) => Promise<boolean>;
</script>

<div>
    <LiveGameEditAllowanceBar access={correction_access} {on_reset_edits} />
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

    {#if sorted_events.length === 0}
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
                {#if fixture_status === FIXTURE_STATUS.SCHEDULED}
                    Start the game to begin recording events
                {:else if is_game_active && correction_access.can_correct}
                    Use the buttons above to record match events
                {:else if is_game_active}
                    Events will appear here as they happen
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
                {#each sorted_events as event}
                    {@const is_home_event =
                        event.team_side === GAME_EVENT_TEAM_SIDE.HOME}
                    {@const is_match_event =
                        event.team_side === GAME_EVENT_TEAM_SIDE.MATCH}

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
                        <GameTimelineTeamEvent
                            {event}
                            is_home={is_home_event}
                            can_correct={correction_access.can_correct}
                            edit_cost_text={correction_access.edit_cost_text}
                            team_players={is_home_event
                                ? home_players
                                : away_players}
                            {on_correct}
                        />
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
    <LiveGameCorrectionLog {corrections} />
</div>
