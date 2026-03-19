<script lang="ts">
    import {
        get_tier_badge_classes,
        get_score_bar_width,
        type OfficialLeaderboardEntry,
        type PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import { get_tier_label } from "$lib/core/entities/OfficialPerformanceRating";

    export let entry: OfficialLeaderboardEntry;
    export let breakdown_items: PerFixtureRating[];
    export let on_close: () => void;

    function format_rater_role(role: string): string {
        return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
</script>

<div class="card mt-4 border-2 border-primary-200 dark:border-primary-800">
    <div
        class="flex items-center justify-between border-b border-accent-200
           px-4 py-3 dark:border-accent-700"
    >
        <div class="flex flex-wrap items-center gap-3">
            <h2
                class="text-base font-semibold text-accent-900 dark:text-accent-100"
            >
                {entry.official_name}
            </h2>
            <span
                class="inline-flex items-center rounded px-2 py-0.5 text-xs
               font-medium {get_tier_badge_classes(entry.tier)}"
            >
                {get_tier_label(entry.tier)}
            </span>
            <span class="text-xs text-accent-500 dark:text-accent-400">
                {entry.rating_count} rating{entry.rating_count === 1 ? "" : "s"}
            </span>
        </div>
        <button
            type="button"
            onclick={on_close}
            class="rounded p-1.5 text-accent-500 hover:bg-accent-100 hover:text-accent-700
             dark:hover:bg-accent-800 dark:hover:text-accent-300"
            aria-label="Close breakdown"
        >
            ✕
        </button>
    </div>

    <div
        class="grid grid-cols-5 gap-px bg-accent-200 text-center text-sm
           dark:bg-accent-700"
    >
        {#each [{ label: "Composite", value: entry.composite_score }, { label: "Overall", value: entry.overall }, { label: "Decisions", value: entry.decision_accuracy }, { label: "Control", value: entry.game_control }, { label: "Fitness", value: entry.fitness }] as dim}
            <div class="bg-white px-3 py-2 dark:bg-accent-900">
                <div class="flex items-center justify-center gap-1">
                    <div
                        class="h-1.5 w-10 overflow-hidden rounded-full bg-accent-200 dark:bg-accent-700"
                    >
                        <div
                            class="h-full rounded-full bg-primary-500 dark:bg-primary-400"
                            style="width: {get_score_bar_width(dim.value)}"
                        ></div>
                    </div>
                    <span
                        class="font-semibold text-accent-900 dark:text-accent-100"
                        >{dim.value}</span
                    >
                </div>
                <div class="text-xs text-accent-500 dark:text-accent-400">
                    {dim.label}
                </div>
            </div>
        {/each}
    </div>

    {#if breakdown_items.length === 0}
        <p
            class="px-4 py-6 text-center text-sm text-accent-500 dark:text-accent-400"
        >
            No individual rating records found.
        </p>
    {:else}
        <div class="overflow-x-auto">
            <table
                class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
                <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th
                            class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >Fixture</th
                        >
                        <th
                            class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                            >Date</th
                        >
                        <th
                            class="hidden px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell"
                            >Rated By</th
                        >
                        <th
                            class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                        <th
                            class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >Notes</th
                        >
                    </tr>
                </thead>
                <tbody
                    class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                >
                    {#each breakdown_items as item}
                        <tr
                            class="hover:bg-gray-50 dark:hover:bg-gray-800 align-top"
                        >
                            <td
                                class="px-3 py-4 text-sm text-accent-900 dark:text-accent-100 max-w-[10rem] whitespace-nowrap"
                            >
                                <div class="truncate">{item.fixture_label}</div>
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {item.fixture_date}
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {format_rater_role(item.rater_role)}
                            </td>
                            <td
                                class="px-3 py-4 text-sm font-medium text-accent-900 dark:text-accent-100 whitespace-nowrap"
                            >
                                {item.overall}
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {item.decision_accuracy}
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {item.game_control}
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {item.communication}
                            </td>
                            <td
                                class="hidden px-3 py-4 text-sm text-accent-900 dark:text-accent-100 whitespace-nowrap md:table-cell"
                            >
                                {item.fitness}
                            </td>
                            <td
                                class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 italic max-w-xs"
                            >
                                <div class="truncate">{item.notes || "—"}</div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
