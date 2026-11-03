<script lang="ts">
    import type { PlayerStats } from "$lib/presentation/logic/competitionResultsStats";

    import { STATS_DETAIL_TEXT } from "./competitionResultsDisplayConstants";

    const PODIUM_SIZE = 3;

    export let rank: number;
    export let player: PlayerStats;
    export let is_expanded: boolean;
    export let on_toggle: (player_key: string) => void;
</script>

<div class="bg-white dark:bg-gray-900 rounded-lg">
    <button
        type="button"
        class="w-full flex items-center justify-between p-2 sm:p-3 text-left rounded-lg hover:bg-accent-50 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={is_expanded}
        title={is_expanded
            ? STATS_DETAIL_TEXT.HIDE_GAMES
            : STATS_DETAIL_TEXT.SHOW_GAMES}
        on:click={() => on_toggle(player.player_key)}
    >
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <span
                class={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold rounded-full ${rank <= PODIUM_SIZE ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                >{rank}</span
            >
            <div class="min-w-0">
                <div
                    class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                >
                    {player.player_name}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {player.team_name}
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2 ml-2">
            <slot name="value" />
            <svg
                class="w-4 h-4 text-accent-400 transition-transform {is_expanded
                    ? 'rotate-180'
                    : ''}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 9-7 7-7-7"
                /></svg
            >
        </div>
    </button>
    {#if is_expanded}
        <div class="px-2 pb-2 sm:px-3 sm:pb-3">
            <slot name="details" />
        </div>
    {/if}
</div>
