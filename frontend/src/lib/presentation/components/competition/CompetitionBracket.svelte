<script lang="ts">
    import type { BracketLayout } from "$lib/presentation/logic/competitionBracket";
    import {
        type BracketDimensions,
        build_bracket_link_paths,
        measure_bracket,
        position_bracket_card,
    } from "$lib/presentation/logic/competitionBracketGeometry";

    import CompetitionBracketCard from "./CompetitionBracketCard.svelte";

    const DIMENSIONS: BracketDimensions = {
        card_width: 240,
        card_height: 88,
        row_height: 112,
        column_gap: 64,
    };

    export let layout: BracketLayout;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    $: size = measure_bracket(layout, DIMENSIONS);
    $: link_paths = build_bracket_link_paths(layout, DIMENSIONS);
</script>

<div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
    <div class="min-w-max" style="width: {size.width}px">
        <div class="relative h-8 mb-3">
            {#each layout.columns as column, column_index (column.stage.id)}
                <h3
                    class="absolute text-xs font-semibold uppercase tracking-wide text-center text-accent-600 dark:text-accent-300"
                    style="left: {position_bracket_card(
                        column_index,
                        0,
                        DIMENSIONS,
                    ).left}px; width: {DIMENSIONS.card_width}px"
                >
                    {column.stage.name}
                </h3>
            {/each}
        </div>
        <div class="relative" style="height: {size.height}px">
            <svg
                class="absolute inset-0 text-accent-300 dark:text-accent-600"
                width={size.width}
                height={size.height}
                aria-hidden="true"
            >
                {#each link_paths as path}
                    <path
                        d={path}
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                {/each}
            </svg>
            {#each layout.columns as column, column_index (column.stage.id)}
                {#each column.cards as card (card.card_id)}
                    {@const position = position_bracket_card(
                        column_index,
                        card.row,
                        DIMENSIONS,
                    )}
                    <div
                        class="absolute"
                        style="left: {position.left}px; top: {position.top}px; width: {DIMENSIONS.card_width}px; height: {DIMENSIONS.card_height}px"
                    >
                        <CompetitionBracketCard
                            {card}
                            {get_team_name}
                            {get_team_logo_url}
                            {on_open_match_report}
                        />
                    </div>
                {/each}
            {/each}
        </div>
    </div>
</div>
