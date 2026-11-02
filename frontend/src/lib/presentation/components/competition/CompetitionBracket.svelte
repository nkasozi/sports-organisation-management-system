<script lang="ts">
    import type { BracketRound } from "$lib/presentation/logic/competitionBracket";

    import CompetitionBracketTie from "./CompetitionBracketTie.svelte";

    const SLOT_HEIGHT_PIXELS = 128;

    export let rounds: BracketRound[];
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    $: bracket_height_pixels =
        Math.max(1, ...rounds.map((round) => round.slots.length)) *
        SLOT_HEIGHT_PIXELS;
</script>

<div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
    <div class="flex gap-12 min-w-max">
        {#each rounds as round, round_index (round.stage.id)}
            {@const has_next_round = round_index < rounds.length - 1}
            {@const has_previous_round = round_index > 0}
            <div class="w-60 flex flex-col">
                <h3
                    class="text-xs font-semibold uppercase tracking-wide text-center text-accent-600 dark:text-accent-300 mb-3"
                >
                    {round.stage.name}
                </h3>
                <div
                    class="flex flex-col"
                    style="height: {bracket_height_pixels}px"
                >
                    {#each round.slots as slot, slot_index}
                        {@const has_partner_below =
                            slot_index % 2 === 0 &&
                            slot_index + 1 < round.slots.length}
                        <div class="relative flex-1 flex items-center">
                            {#if has_previous_round}
                                <span
                                    class="absolute -left-6 w-6 top-1/2 border-t border-accent-300 dark:border-accent-600"
                                ></span>
                            {/if}
                            {#if has_next_round}
                                <span
                                    class="absolute -right-6 w-6 top-1/2 border-t border-accent-300 dark:border-accent-600"
                                ></span>
                            {/if}
                            {#if has_next_round && has_partner_below}
                                <span
                                    class="absolute -right-6 top-1/2 h-full border-r border-accent-300 dark:border-accent-600"
                                ></span>
                            {/if}
                            <CompetitionBracketTie
                                {slot}
                                {get_team_name}
                                {get_team_logo_url}
                                {on_open_match_report}
                            />
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>
