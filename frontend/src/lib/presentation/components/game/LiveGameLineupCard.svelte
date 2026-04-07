<script lang="ts">
    import type { SvelteComponent } from "svelte";

    import type {
        LineupPlayer,
        PlayerTimeOnStatus,
    } from "$lib/core/entities/FixtureLineup";

    import LiveGameLineupPlayerRow from "./LiveGameLineupPlayerRow.svelte";

    export let accent: "blue" | "red";
    export let icon: string;
    export let team_name: string;
    export let players: LineupPlayer[];
    export let starters: LineupPlayer[];
    export let substitutes: LineupPlayer[];
    export let expanded: boolean;
    export let expandable: boolean;
    export let is_game_active: boolean;
    export let elapsed_minutes: number;
    export let on_toggle: () => void;
    export let on_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;

    const lineup_player_row_component =
        LiveGameLineupPlayerRow as unknown as typeof SvelteComponent;
</script>

<div
    class={`bg-${accent}-50 dark:bg-${accent}-900/20 rounded-lg p-4 border border-${accent}-200 dark:border-${accent}-800 overflow-hidden`}
>
    <div class="flex items-center justify-between mb-3">
        {#if expandable}
            <button
                type="button"
                class="w-full flex items-center justify-between text-left"
                on:click={on_toggle}
            >
                <span
                    class={`text-sm font-semibold text-${accent}-700 dark:text-${accent}-300`}
                    >{icon} {team_name}</span
                >
                <span
                    class={`text-xs text-${accent}-600 dark:text-${accent}-400 bg-${accent}-100 dark:bg-${accent}-800 px-2 py-0.5 rounded-full`}
                    >{players.length}</span
                >
            </button>
        {:else}
            <div class="w-full flex items-center justify-between">
                <span
                    class={`text-sm font-semibold text-${accent}-700 dark:text-${accent}-300`}
                    >{icon} {team_name}</span
                >
                <span
                    class={`text-xs text-${accent}-600 dark:text-${accent}-400 bg-${accent}-100 dark:bg-${accent}-800 px-2 py-0.5 rounded-full`}
                    >{players.length} players</span
                >
            </div>
        {/if}
    </div>

    {#if !expandable || expanded}
        {#if players.length === 0}
            <p
                class="text-sm text-gray-500 dark:text-gray-400 text-center py-4"
            >
                No lineup submitted yet
            </p>
        {:else}
            <div class="space-y-3">
                {#if starters.length > 0}
                    <div>
                        <div
                            class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                        >
                            Starting XI
                        </div>
                        <div class="space-y-1">
                            {#each starters as player}
                                <svelte:component
                                    this={lineup_player_row_component}
                                    {accent}
                                    badge_tone="primary"
                                    {elapsed_minutes}
                                    fallback_time_on={"present_at_start"}
                                    {is_game_active}
                                    {on_time_on_change}
                                    {player}
                                    show_position_when_inactive={true}
                                    subdued={false}
                                    text_tone="primary"
                                />
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if substitutes.length > 0}
                    <div
                        class={`border-t border-${accent}-200 dark:border-${accent}-700 pt-3`}
                    >
                        <div
                            class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                        >
                            Substitutes
                        </div>
                        <div class="space-y-1">
                            {#each substitutes as player}
                                <svelte:component
                                    this={lineup_player_row_component}
                                    {accent}
                                    badge_tone="secondary"
                                    {elapsed_minutes}
                                    fallback_time_on={"didnt_play"}
                                    {is_game_active}
                                    {on_time_on_change}
                                    {player}
                                    show_position_when_inactive={false}
                                    subdued={true}
                                    text_tone="secondary"
                                />
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if starters.length === 0}
                    <div class="space-y-1">
                        {#each players as player}
                            <div class="flex items-center gap-2 text-sm py-1">
                                {#if player.jersey_number}
                                    <span
                                        class={`w-6 h-6 flex items-center justify-center bg-${accent}-600 text-white text-xs font-bold rounded flex-shrink-0`}
                                        >{player.jersey_number}</span
                                    >
                                {:else}
                                    <span
                                        class="w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                        >-</span
                                    >
                                {/if}

                                <span
                                    class="text-gray-800 dark:text-gray-200 truncate"
                                    >{player.first_name}
                                    {player.last_name}</span
                                >
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>
