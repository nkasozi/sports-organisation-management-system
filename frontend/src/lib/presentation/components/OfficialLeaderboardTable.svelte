<script lang="ts">
    import {
        get_tier_badge_classes,
        get_score_bar_width,
        type OfficialLeaderboardEntry,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import { get_tier_label } from "$lib/core/entities/OfficialPerformanceRating";

    export let entries: OfficialLeaderboardEntry[] = [];
    export let selected_official_id: string = "";
    export let on_select: (entry: OfficialLeaderboardEntry) => void;
</script>

<div class="card overflow-x-auto -mx-4 sm:mx-0">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
                <th
                    class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >#</th
                >
                <th
                    class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >Official</th
                >
                <th
                    class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >Tier</th
                >
                <th
                    class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >Ratings</th
                >
                <th
                    class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >Score</th
                >
                <th
                    class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                    >Overall</th
                >
                <th
                    class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                    >Decisions</th
                >
                <th
                    class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                    >Control</th
                >
                <th
                    class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                    >Comms</th
                >
                <th
                    class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                    >Fitness</th
                >
            </tr>
        </thead>
        <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
        >
            {#each entries as entry, index}
                {@const is_selected =
                    entry.official_id === selected_official_id}
                <tr
                    class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
                 {is_selected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}"
                    onclick={() => on_select(entry)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === "Enter" && on_select(entry)}
                >
                    <td
                        class="px-3 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                        >{index + 1}</td
                    >
                    <td
                        class="px-3 py-4 text-sm font-semibold text-accent-900 dark:text-accent-100 whitespace-nowrap"
                        >{entry.official_name}</td
                    >
                    <td class="px-3 py-4 text-sm whitespace-nowrap">
                        <span
                            class="inline-flex items-center rounded px-2 py-0.5 text-xs
                     font-medium {get_tier_badge_classes(entry.tier)}"
                        >
                            {get_tier_label(entry.tier)}
                        </span>
                    </td>
                    <td
                        class="px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap"
                        >{entry.rating_count}</td
                    >
                    <td class="px-3 py-4 text-sm whitespace-nowrap">
                        <div class="flex items-center gap-2">
                            <div
                                class="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                            >
                                <div
                                    class="h-full rounded-full bg-primary-600 dark:bg-primary-400"
                                    style="width: {get_score_bar_width(
                                        entry.composite_score,
                                    )}"
                                ></div>
                            </div>
                            <span
                                class="font-semibold text-accent-900 dark:text-accent-100"
                                >{entry.composite_score}</span
                            >
                        </div>
                    </td>
                    <td
                        class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                        >{entry.overall}</td
                    >
                    <td
                        class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                        >{entry.decision_accuracy}</td
                    >
                    <td
                        class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                        >{entry.game_control}</td
                    >
                    <td
                        class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                        >{entry.communication}</td
                    >
                    <td
                        class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                        >{entry.fitness}</td
                    >
                </tr>
                <tr class="bg-gray-50 dark:bg-gray-800 md:hidden">
                    <td colspan="5" class="px-3 py-2">
                        <div
                            class="grid grid-cols-5 gap-2 text-xs text-gray-500 dark:text-gray-400"
                        >
                            {#each [{ label: "Overall", value: entry.overall }, { label: "Decisions", value: entry.decision_accuracy }, { label: "Control", value: entry.game_control }, { label: "Comms", value: entry.communication }, { label: "Fitness", value: entry.fitness }] as dim}
                                <div class="text-center">
                                    <div
                                        class="font-semibold text-accent-900 dark:text-accent-100"
                                    >
                                        {dim.value}
                                    </div>
                                    <div>{dim.label}</div>
                                </div>
                            {/each}
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
