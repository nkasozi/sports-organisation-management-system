<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { TeamStanding } from "$lib/presentation/logic/competitionStageResults";

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
    <div class="hidden sm:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th
                        class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >#</th
                    >
                    <th
                        class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >Team</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >MP</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >W</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >D</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >L</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                        >GF</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                        >GA</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >GD</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold"
                        >Pts</th
                    >
                    <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >Last 5</th
                    >
                </tr>
            </thead>
            <tbody
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
            >
                {#each standings as standing, index}
                    <tr
                        class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors {selected_team_id ===
                        standing.team_id
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : ''}"
                        on:click={() =>
                            handle_team_click(
                                standing.team_id,
                                standing.team_name,
                            )}
                    >
                        <td
                            class="px-3 py-3 text-sm font-medium {index <
                            highlight_top_count
                                ? 'text-green-600'
                                : 'text-gray-600 dark:text-gray-400'}"
                        >
                            {index + 1}
                        </td>
                        <td
                            class="px-3 py-3 text-sm font-medium text-accent-900 dark:text-accent-100 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                            <span class="flex items-center gap-2">
                                {#if live_team_ids.has(standing.team_id)}
                                    <span
                                        class="relative flex h-2.5 w-2.5 flex-shrink-0"
                                    >
                                        <span
                                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                                        ></span>
                                        <span
                                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"
                                        ></span>
                                    </span>
                                {/if}
                                {standing.team_name}
                                <svg
                                    class="w-3.5 h-3.5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                            </span>
                        </td>
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                            >{standing.played}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                            >{standing.won}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                            >{standing.drawn}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                            >{standing.lost}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400 hidden md:table-cell"
                            >{standing.goals_for}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400 hidden md:table-cell"
                            >{standing.goals_against}</td
                        >
                        <td
                            class="px-3 py-3 text-sm text-center {standing.goal_difference >
                            0
                                ? 'text-green-600'
                                : standing.goal_difference < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600 dark:text-gray-400'}"
                        >
                            {standing.goal_difference > 0
                                ? "+"
                                : ""}{standing.goal_difference}
                        </td>
                        <td
                            class="px-3 py-3 text-sm text-center font-bold text-accent-900 dark:text-accent-100"
                            >{standing.points}</td
                        >
                        <td class="px-3 py-3 text-center">
                            <div
                                class="flex items-center justify-center gap-0.5"
                            >
                                {#each standing.form as form_result}
                                    <span
                                        class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                                            {form_result === 'W'
                                            ? 'bg-green-500 text-white'
                                            : form_result === 'D'
                                              ? 'bg-gray-400 text-white'
                                              : 'bg-red-500 text-white'}"
                                    >
                                        {form_result === "L"
                                            ? "✕"
                                            : form_result}
                                    </span>
                                {/each}
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="sm:hidden space-y-2">
        {#each standings as standing, index}
            <button
                type="button"
                class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors {selected_team_id ===
                standing.team_id
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : ''}"
                on:click={() =>
                    handle_team_click(standing.team_id, standing.team_name)}
            >
                <div class="flex items-center gap-3">
                    <span
                        class="w-6 h-6 flex items-center justify-center text-sm font-bold rounded-full {index <
                        highlight_top_count
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
                    >
                        {index + 1}
                    </span>
                    <span class="flex items-center gap-1.5">
                        {#if live_team_ids.has(standing.team_id)}
                            <span
                                class="relative flex h-2.5 w-2.5 flex-shrink-0"
                            >
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                                ></span>
                                <span
                                    class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"
                                ></span>
                            </span>
                        {/if}
                        <span
                            class="font-medium text-accent-900 dark:text-accent-100 truncate max-w-[120px] text-left"
                        >
                            {standing.team_name}
                        </span>
                    </span>
                </div>
                <div class="flex items-center gap-3 text-sm">
                    <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            MP
                        </div>
                        <div
                            class="font-medium text-gray-700 dark:text-gray-300"
                        >
                            {standing.played}
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            GD
                        </div>
                        <div
                            class="font-medium {standing.goal_difference > 0
                                ? 'text-green-600'
                                : standing.goal_difference < 0
                                  ? 'text-red-600'
                                  : 'text-gray-700 dark:text-gray-300'}"
                        >
                            {standing.goal_difference > 0
                                ? "+"
                                : ""}{standing.goal_difference}
                        </div>
                    </div>
                    <div class="text-center min-w-[32px]">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            Pts
                        </div>
                        <div
                            class="font-bold text-accent-900 dark:text-accent-100"
                        >
                            {standing.points}
                        </div>
                    </div>
                    <div class="flex items-center gap-0.5">
                        {#each standing.form.slice(-3) as form_result}
                            <span
                                class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold
                                    {form_result === 'W'
                                    ? 'bg-green-500 text-white'
                                    : form_result === 'D'
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-red-500 text-white'}"
                            >
                                {form_result === "L" ? "✕" : form_result}
                            </span>
                        {/each}
                    </div>
                    <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </div>
            </button>
        {/each}
    </div>

    {#if show_legend}
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
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
