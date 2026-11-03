<script lang="ts">
    import type { CardStatCategory } from "$lib/presentation/logic/competitionResultsCardStats";
    import { group_player_moments_by_game } from "$lib/presentation/logic/competitionResultsPlayerGames";
    import {
        PLAYER_STAT_MOMENT_KIND,
        type PlayerStatMoment,
        type PlayerStatMomentKind,
    } from "$lib/presentation/logic/competitionResultsPlayerMoments";
    import type { PlayerStats } from "$lib/presentation/logic/competitionResultsStats";

    import { STATS_DETAIL_TEXT } from "./competitionResultsDisplayConstants";

    export let player: PlayerStats;
    export let kind: PlayerStatMomentKind;
    export let card_categories: CardStatCategory[];
    export let format_date: (date_string: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    $: games = group_player_moments_by_game(player.moments, kind);

    function describe_moment(moment: PlayerStatMoment): string {
        switch (moment.kind) {
            case PLAYER_STAT_MOMENT_KIND.SCORE:
                return moment.points > 1
                    ? `${STATS_DETAIL_TEXT.SCORE} (+${moment.points})`
                    : STATS_DETAIL_TEXT.SCORE;
            case PLAYER_STAT_MOMENT_KIND.ASSIST:
                return STATS_DETAIL_TEXT.ASSIST;
            case PLAYER_STAT_MOMENT_KIND.CARD:
                return (
                    card_categories.find(
                        (category) =>
                            category.card_type_id === moment.card_type_id,
                    )?.label ?? moment.card_type_id
                );
        }
    }

    function card_color(moment: PlayerStatMoment): string {
        if (moment.kind !== PLAYER_STAT_MOMENT_KIND.CARD) return "";
        return (
            card_categories.find(
                (category) => category.card_type_id === moment.card_type_id,
            )?.color ?? ""
        );
    }
</script>

<ul class="divide-y divide-accent-100 dark:divide-gray-800">
    {#each games as game (game.fixture_id)}
        <li class="py-2 flex items-start justify-between gap-3">
            <div class="min-w-0">
                <div class="text-sm text-accent-900 dark:text-accent-100">
                    {STATS_DETAIL_TEXT.VERSUS}
                    {get_team_name(game.opponent_team_id)}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    {format_date(game.kickoff)}
                </div>
                <div class="mt-1 flex flex-wrap gap-1.5">
                    {#each game.moments as moment, moment_index (moment_index)}
                        <span
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-[0.175rem] bg-accent-100 dark:bg-gray-800 text-accent-700 dark:text-accent-200"
                        >
                            {#if card_color(moment)}
                                <span
                                    class="w-2 h-3 rounded-sm"
                                    style:background-color={card_color(moment)}
                                ></span>
                            {/if}
                            {describe_moment(moment)}
                            {#if moment.timing_label}
                                <span class="text-accent-500"
                                    >· {moment.timing_label}</span
                                >
                            {/if}
                        </span>
                    {/each}
                </div>
            </div>
            <button
                type="button"
                class="shrink-0 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                on:click={() => on_open_match_report(game.fixture_id)}
                >{STATS_DETAIL_TEXT.MATCH_REPORT}</button
            >
        </li>
    {/each}
</ul>
