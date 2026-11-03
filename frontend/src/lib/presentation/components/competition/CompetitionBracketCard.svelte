<script lang="ts">
    import {
        BRACKET_OUTCOME_STATUS,
        type BracketCard,
        type BracketTeamLine,
    } from "$lib/presentation/logic/competitionBracket";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

    import { BRACKET_TEXT } from "./competitionResultsDisplayConstants";

    export let card: BracketCard;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    $: team_lines =
        card.content.status === PRESENCE_STATUS.PRESENT
            ? [card.content.match.home, card.content.match.away]
            : [];

    function is_losing_line(line: BracketTeamLine): boolean {
        return (
            card.content.status === PRESENCE_STATUS.PRESENT &&
            card.content.match.outcome.status ===
                BRACKET_OUTCOME_STATUS.DECIDED &&
            card.content.match.outcome.winner_team_id !== line.team_id
        );
    }

    function open_match(): boolean {
        if (card.content.status !== PRESENCE_STATUS.PRESENT) return false;
        on_open_match_report(card.content.match.fixture_id);
        return true;
    }
</script>

{#if card.content.status === PRESENCE_STATUS.PRESENT}
    <button
        type="button"
        class="w-full h-full text-left rounded-[0.175rem] border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-900 hover:border-primary-500 transition-colors divide-y divide-accent-200 dark:divide-accent-700"
        title={BRACKET_TEXT.OPEN_MATCH_REPORT}
        on:click={open_match}
    >
        {#each team_lines as line}
            <div
                class="flex items-center gap-2 px-3 h-1/2 {is_losing_line(line)
                    ? 'text-accent-500 dark:text-accent-400'
                    : 'text-accent-900 dark:text-accent-100 font-semibold'}"
            >
                {#if line.team_id && get_team_logo_url(line.team_id)}
                    <img
                        src={get_team_logo_url(line.team_id)}
                        alt=""
                        class="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                {:else}
                    <span
                        class="w-7 h-7 rounded-full bg-accent-300 dark:bg-accent-600 text-white flex items-center justify-center text-sm font-bold shrink-0"
                        >{line.team_id
                            ? get_team_name(line.team_id).charAt(0)
                            : BRACKET_TEXT.UNKNOWN_TEAM_MARK}</span
                    >
                {/if}
                <span class="flex-1 truncate text-sm"
                    >{line.team_id
                        ? get_team_name(line.team_id)
                        : BRACKET_TEXT.TO_BE_DECIDED}</span
                >
                {#if line.score.status === PRESENCE_STATUS.PRESENT}
                    <span class="text-sm tabular-nums">{line.score.value}</span>
                {/if}
            </div>
        {/each}
    </button>
{:else}
    <div
        class="w-full h-full rounded-[0.175rem] border border-dashed border-accent-300 dark:border-accent-600 divide-y divide-dashed divide-accent-300 dark:divide-accent-600"
    >
        {#each [0, 1] as placeholder_index (placeholder_index)}
            <div
                class="flex items-center gap-2 px-3 h-1/2 text-accent-500 dark:text-accent-400"
            >
                <span
                    class="w-7 h-7 rounded-full bg-accent-300 dark:bg-accent-600 text-white flex items-center justify-center text-sm font-bold shrink-0"
                    >{BRACKET_TEXT.UNKNOWN_TEAM_MARK}</span
                >
                <span class="text-sm">{BRACKET_TEXT.TO_BE_DECIDED}</span>
            </div>
        {/each}
    </div>
{/if}
