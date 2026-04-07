<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import type { TeamStanding } from "$lib/presentation/logic/competitionStageResults";

    import CompetitionStandingsRow from "./CompetitionStandingsRow.svelte";

    export let standings: TeamStanding[] = [];
    export let selected_team_id: string | null = null;
    export let empty_message: string =
        "No teams registered for this section yet.";
    export let show_legend: boolean = true;
    export let highlight_top_count: number = 3;
    export let live_team_ids: Set<string> = new Set();

    const dispatch = createEventDispatcher<{
        teamclick: { team_id: string; team_name: string };
    }>();

    function handle_team_click(team_id: string, team_name: string): void {
        dispatch("teamclick", { team_id, team_name });
    }
</script>

{#if standings.length === 0}
    <div class="text-center py-8 text-accent-500">{empty_message}</div>
{:else}
    <div class="overflow-x-auto -mx-4 sm:mx-0">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th
                        class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[160px]"
                        >Team</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >MP</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >W</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >D</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >L</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >GF</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >GA</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >GD</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold whitespace-nowrap"
                        >Pts</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >Form</th
                    >
                </tr>
            </thead>
            <tbody
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
            >
                {#each standings as standing, index}
                    <CompetitionStandingsRow
                        {standing}
                        {index}
                        {selected_team_id}
                        {highlight_top_count}
                        {live_team_ids}
                        on_team_click={handle_team_click}
                    />
                {/each}
            </tbody>
        </table>
    </div>

    {#if show_legend}
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div
                class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider"
            >
                Key
            </div>
            <div
                class="grid grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3"
            >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">MP</strong
                    > = Matches Played</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">W</strong> =
                    Won</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">D</strong> =
                    Drawn</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">L</strong> =
                    Lost</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">GF</strong
                    > = Goals For</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">GA</strong
                    > = Goals Against</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300">GD</strong
                    > = Goal Difference</span
                >
                <span
                    ><strong class="text-gray-700 dark:text-gray-300"
                        >Pts</strong
                    > = Points</span
                >
            </div>
            <div
                class="grid grid-cols-4 gap-x-4 gap-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400"
            >
                <span class="flex items-center gap-1.5">
                    <span
                        class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold"
                        >W</span
                    >
                    Win
                </span>
                <span class="flex items-center gap-1.5">
                    <span
                        class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 text-white text-[10px] font-bold"
                        >D</span
                    >
                    Draw
                </span>
                <span class="flex items-center gap-1.5">
                    <span
                        class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold"
                        >✕</span
                    >
                    Loss
                </span>
                <span class="flex items-center gap-1.5">
                    <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"
                        ></span>
                    </span>
                    Live match
                </span>
            </div>
        </div>
    {/if}
{/if}
