<script lang="ts">
    import {
        type CardSortMode,
        type CardStatCategory,
        count_player_card_type,
        create_card_type_sort_mode,
        is_card_sort_mode_selected,
        type PlayerStats,
        TOTAL_CARD_SORT_MODE,
    } from "$lib/presentation/logic/competitionResultsCardStats";
    import { PLAYER_STAT_MOMENT_KIND } from "$lib/presentation/logic/competitionResultsPlayerMoments";

    import { COMPETITION_STATS_ALL_TEAMS_FILTER } from "./competitionResultsDisplayConstants";
    import StatsLeaderboardRow from "./StatsLeaderboardRow.svelte";
    import StatsPlayerGames from "./StatsPlayerGames.svelte";

    export let stats_team_filter: string;
    export let stats_card_categories: CardStatCategory[];
    export let stats_card_sort: CardSortMode;
    export let stats_filtered_card_players: PlayerStats[];
    export let format_date: (date_string: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    let expanded_player_key = "";

    function toggle_player(player_key: string): string {
        expanded_player_key =
            expanded_player_key === player_key ? "" : player_key;
        return expanded_player_key;
    }

    const CHIP_BASE_CLASSES =
        "px-2.5 py-1.5 transition-colors flex items-center gap-1";
    const CHIP_SELECTED_CLASSES = "bg-theme-primary-500 text-white";
    const CHIP_IDLE_CLASSES =
        "bg-white dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-700";
    const CHIP_DIVIDER_CLASSES =
        "border-l border-accent-200 dark:border-accent-700";

    function chip_classes(
        current_mode: CardSortMode,
        chip_mode: CardSortMode,
        has_divider: boolean,
    ): string {
        const state_classes = is_card_sort_mode_selected(
            current_mode,
            chip_mode,
        )
            ? CHIP_SELECTED_CLASSES
            : CHIP_IDLE_CLASSES;
        const divider_classes = has_divider ? CHIP_DIVIDER_CLASSES : "";
        return `${CHIP_BASE_CLASSES} ${divider_classes} ${state_classes}`;
    }
</script>

<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"
    >
        <h3
            class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 flex items-center gap-2 shrink-0"
        >
            <span>🟨</span> Most Cards
        </h3>
        {#if stats_card_categories.length > 0}
            <div
                class="flex flex-wrap rounded-md border border-accent-200 dark:border-accent-700 overflow-hidden text-xs font-medium self-start sm:self-auto"
            >
                <button
                    type="button"
                    class={chip_classes(
                        stats_card_sort,
                        TOTAL_CARD_SORT_MODE,
                        false,
                    )}
                    on:click={() => (stats_card_sort = TOTAL_CARD_SORT_MODE)}
                    >All</button
                >
                {#each stats_card_categories as category (category.card_type_id)}
                    <button
                        type="button"
                        class={chip_classes(
                            stats_card_sort,
                            create_card_type_sort_mode(category.card_type_id),
                            true,
                        )}
                        on:click={() =>
                            (stats_card_sort = create_card_type_sort_mode(
                                category.card_type_id,
                            ))}
                        ><span
                            class="w-2 h-3 rounded-sm inline-block"
                            style:background-color={category.color}
                        ></span>
                        {category.label}</button
                    >
                {/each}
            </div>
        {/if}
    </div>
    {#if stats_filtered_card_players.length === 0}
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
            {stats_team_filter === COMPETITION_STATS_ALL_TEAMS_FILTER
                ? "No cards issued yet."
                : `No cards issued to ${stats_team_filter} players yet.`}
        </div>
    {:else}
        <div class="space-y-2">
            {#each stats_filtered_card_players as player, index (player.player_key)}
                <StatsLeaderboardRow
                    rank={index + 1}
                    {player}
                    is_expanded={expanded_player_key === player.player_key}
                    on_toggle={toggle_player}
                >
                    <div
                        slot="value"
                        class="flex flex-wrap justify-end gap-2 sm:gap-3"
                    >
                        {#each stats_card_categories as category (category.card_type_id)}
                            {#if count_player_card_type(player, category.card_type_id) > 0}
                                <span
                                    class="flex items-center gap-1"
                                    title={category.label}
                                    ><span
                                        class="w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-sm"
                                        style:background-color={category.color}
                                    ></span><span
                                        class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >{count_player_card_type(
                                            player,
                                            category.card_type_id,
                                        )}</span
                                    ></span
                                >
                            {/if}
                        {/each}
                    </div>
                    <StatsPlayerGames
                        slot="details"
                        {player}
                        kind={PLAYER_STAT_MOMENT_KIND.CARD}
                        card_categories={stats_card_categories}
                        {format_date}
                        {get_team_name}
                        {on_open_match_report}
                    />
                </StatsLeaderboardRow>
            {/each}
        </div>
    {/if}
</div>
