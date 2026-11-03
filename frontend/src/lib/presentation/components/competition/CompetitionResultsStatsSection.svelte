<script lang="ts">
    import type {
        CardSortMode,
        CardStatCategory,
        PlayerStats,
    } from "$lib/presentation/logic/competitionResultsCardStats";
    import { PLAYER_STAT_MOMENT_KIND } from "$lib/presentation/logic/competitionResultsPlayerMoments";

    import CompetitionResultsCardLeaders from "./CompetitionResultsCardLeaders.svelte";
    import {
        COMPETITION_STATS_ALL_TEAMS_FILTER,
        STATS_DETAIL_TEXT,
        STATS_SECTION_TEXT,
    } from "./competitionResultsDisplayConstants";
    import StatsLeaderboardCard from "./StatsLeaderboardCard.svelte";

    export let stats_team_filter: string;
    export let stats_available_teams: string[];
    export let stats_card_categories: CardStatCategory[];
    export let stats_card_sort: CardSortMode;
    export let stats_filtered_scorers: PlayerStats[];
    export let stats_filtered_assisters: PlayerStats[];
    export let stats_filtered_card_players: PlayerStats[];
    export let format_date: (date_string: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
</script>

<div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span
            class="text-sm font-medium text-accent-600 dark:text-accent-400 shrink-0"
            >Filter by team:</span
        >
        <select
            bind:value={stats_team_filter}
            class="text-sm rounded-[0.175rem] border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 px-3 py-1.5 focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent w-full sm:w-auto sm:max-w-xs"
        >
            <option value={COMPETITION_STATS_ALL_TEAMS_FILTER}>All Teams</option
            >
            {#each stats_available_teams as team_name}
                <option value={team_name}>{team_name}</option>
            {/each}
        </select>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StatsLeaderboardCard
            title={STATS_SECTION_TEXT.TOP_SCORERS}
            icon={STATS_SECTION_TEXT.SCORERS_ICON}
            empty_message={stats_team_filter ===
            COMPETITION_STATS_ALL_TEAMS_FILTER
                ? STATS_SECTION_TEXT.NO_SCORES
                : `${STATS_SECTION_TEXT.NO_SCORES_FOR} ${stats_team_filter} yet.`}
            players={stats_filtered_scorers}
            read_value={(player) => player.points}
            kind={PLAYER_STAT_MOMENT_KIND.SCORE}
            card_categories={stats_card_categories}
            {format_date}
            {get_team_name}
            {on_open_match_report}
        />
        <StatsLeaderboardCard
            title={STATS_DETAIL_TEXT.TOP_ASSISTS}
            icon={STATS_SECTION_TEXT.ASSISTS_ICON}
            empty_message={STATS_DETAIL_TEXT.NO_ASSISTS}
            players={stats_filtered_assisters}
            read_value={(player) => player.assists}
            kind={PLAYER_STAT_MOMENT_KIND.ASSIST}
            card_categories={stats_card_categories}
            {format_date}
            {get_team_name}
            {on_open_match_report}
        />
        <CompetitionResultsCardLeaders
            {stats_team_filter}
            {stats_card_categories}
            bind:stats_card_sort
            {stats_filtered_card_players}
            {format_date}
            {get_team_name}
            {on_open_match_report}
        />
    </div>
</div>
