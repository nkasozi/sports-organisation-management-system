<script lang="ts">
    import type {
        LineupPlayer,
        PlayerTimeOnStatus,
    } from "$lib/core/entities/FixtureLineup";
    import { get_time_on_options } from "$lib/presentation/logic/liveGameDetailState";

    interface $$Props {
        accent: "blue" | "red";
        badge_tone: "primary" | "secondary";
        elapsed_minutes: number;
        fallback_time_on: PlayerTimeOnStatus;
        is_game_active: boolean;
        on_time_on_change: (
            player_id: string,
            new_time_on: PlayerTimeOnStatus,
        ) => Promise<boolean>;
        player: LineupPlayer;
        show_position_when_inactive: boolean;
        subdued: boolean;
        text_tone: "primary" | "secondary";
    }

    export let accent: "blue" | "red";
    export let badge_tone: "primary" | "secondary";
    export let elapsed_minutes: number;
    export let fallback_time_on: PlayerTimeOnStatus;
    export let is_game_active: boolean;
    export let on_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;
    export let player: LineupPlayer;
    export let show_position_when_inactive: boolean;
    export let subdued: boolean;
    export let text_tone: "primary" | "secondary";

    $: container_class = subdued
        ? "flex items-center gap-2 text-sm py-1 opacity-80"
        : "flex items-center gap-2 text-sm py-1";
    $: name_class =
        text_tone === "primary"
            ? "text-gray-800 dark:text-gray-200 truncate flex-1"
            : "text-gray-700 dark:text-gray-300 truncate flex-1";
    $: jersey_class =
        badge_tone === "primary"
            ? `w-6 h-6 flex items-center justify-center bg-${accent}-600 text-white text-xs font-bold rounded flex-shrink-0`
            : `w-6 h-6 flex items-center justify-center bg-${accent}-400 text-white text-xs font-bold rounded flex-shrink-0`;
    $: empty_jersey_class = subdued
        ? "w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs rounded flex-shrink-0"
        : "w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0";
</script>

<div class={container_class}>
    {#if player.jersey_number}
        <span class={jersey_class}>{player.jersey_number}</span>
    {:else}
        <span class={empty_jersey_class}>-</span>
    {/if}

    <span class={name_class}>
        {player.first_name}
        {player.last_name}
        {#if player.is_captain}
            <span class="text-yellow-600 dark:text-yellow-400">©</span>
        {/if}
    </span>

    {#if is_game_active}
        <select
            class="w-16 text-xs px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            value={player.time_on || fallback_time_on}
            on:change={(event) =>
                void on_time_on_change(
                    player.id,
                    (event.currentTarget as HTMLSelectElement)
                        .value as PlayerTimeOnStatus,
                )}
        >
            {#each get_time_on_options(elapsed_minutes) as option}
                <option value={option.value}
                    >{option.label === "Present at Start"
                        ? "X"
                        : option.label === "Didn't Play"
                          ? "-"
                          : option.label}</option
                >
            {/each}
        </select>
    {:else if show_position_when_inactive && player.position}
        <span class="text-xs text-gray-500 dark:text-gray-400"
            >{player.position}</span
        >
    {/if}
</div>
