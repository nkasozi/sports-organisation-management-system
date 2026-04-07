<script lang="ts">
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import { build_match_report_lineup_groups } from "$lib/presentation/logic/matchReportPageState";

    const MATCH_REPORT_LINEUP_STYLE_BY_VARIANT = {
        home: {
            icon: "🏠",
            icon_class: "text-blue-600 dark:text-blue-400",
            panel_background_class: "bg-blue-50/50 dark:bg-blue-900/10",
            divider_class: "border-blue-200 dark:border-blue-700",
            primary_number_class: "bg-blue-600 text-white",
            secondary_number_class: "bg-blue-400 text-white",
        },
        away: {
            icon: "✈️",
            icon_class: "text-red-600 dark:text-red-400",
            panel_background_class: "bg-red-50/50 dark:bg-red-900/10",
            divider_class: "border-red-200 dark:border-red-700",
            primary_number_class: "bg-red-600 text-white",
            secondary_number_class: "bg-red-400 text-white",
        },
    } as const;

    export let team_name: string;
    export let players: LineupPlayer[];
    export let variant: keyof typeof MATCH_REPORT_LINEUP_STYLE_BY_VARIANT;

    let is_expanded: boolean = true;

    $: lineup_groups = build_match_report_lineup_groups(players);
    $: lineup_style = MATCH_REPORT_LINEUP_STYLE_BY_VARIANT[variant];
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
>
    <button
        type="button"
        class="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        on:click={() => (is_expanded = !is_expanded)}
    >
        <span class="flex items-center gap-2">
            <span class={lineup_style.icon_class}>{lineup_style.icon}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white"
                >{team_name} Lineup</span
            >
            <span
                class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
            >
                {players.length}
            </span>
        </span>
        <svg
            class="w-5 h-5 text-gray-400 transition-transform duration-200 {is_expanded
                ? 'rotate-180'
                : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if is_expanded}
        <div
            class="border-t border-gray-200 dark:border-gray-700 p-3 {lineup_style.panel_background_class} max-h-80 overflow-y-auto"
        >
            {#if players.length === 0}
                <div
                    class="flex flex-col items-center justify-center py-6 gap-2"
                >
                    <svg
                        class="w-8 h-8 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <p
                        class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                        Lineup Not Submitted
                    </p>
                    <p
                        class="text-xs text-gray-400 dark:text-gray-500 text-center"
                    >
                        This team hasn't submitted their lineup yet.
                    </p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#if lineup_groups.starters.length > 0}
                        <div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                                Starting XI
                            </div>
                            <div class="space-y-1">
                                {#each lineup_groups.starters as player}
                                    <div
                                        class="flex items-center gap-2 text-sm py-1"
                                    >
                                        <span
                                            class="w-6 h-6 flex items-center justify-center text-xs font-bold rounded flex-shrink-0 {player.jersey_number
                                                ? lineup_style.primary_number_class
                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}"
                                        >
                                            {player.jersey_number ?? "-"}
                                        </span>
                                        <span
                                            class="text-gray-800 dark:text-gray-200 truncate flex-1"
                                        >
                                            {player.first_name}
                                            {player.last_name}
                                            {#if player.is_captain}
                                                <span
                                                    class="text-yellow-600 dark:text-yellow-400"
                                                    >©</span
                                                >
                                            {/if}
                                        </span>
                                        {#if player.position}
                                            <span
                                                class="text-xs text-gray-500 dark:text-gray-400"
                                                >{player.position}</span
                                            >
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if lineup_groups.substitutes.length > 0}
                        <div class="border-t pt-3 {lineup_style.divider_class}">
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                                Substitutes
                            </div>
                            <div class="space-y-1">
                                {#each lineup_groups.substitutes as player}
                                    <div
                                        class="flex items-center gap-2 text-sm py-1 opacity-80"
                                    >
                                        <span
                                            class="w-6 h-6 flex items-center justify-center text-xs font-bold rounded flex-shrink-0 {player.jersey_number
                                                ? lineup_style.secondary_number_class
                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}"
                                        >
                                            {player.jersey_number ?? "-"}
                                        </span>
                                        <span
                                            class="text-gray-700 dark:text-gray-300 truncate flex-1"
                                        >
                                            {player.first_name}
                                            {player.last_name}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if lineup_groups.starters.length === 0}
                        <div class="space-y-1">
                            {#each players as player}
                                <div
                                    class="flex items-center gap-2 text-sm py-1"
                                >
                                    <span
                                        class="w-6 h-6 flex items-center justify-center text-xs rounded flex-shrink-0 {player.jersey_number
                                            ? lineup_style.primary_number_class
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}"
                                    >
                                        {player.jersey_number ?? "-"}
                                    </span>
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
        </div>
    {/if}
</div>
