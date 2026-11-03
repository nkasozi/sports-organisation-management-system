<script lang="ts">
    import CompetitionStandingsTable from "$lib/presentation/components/competition/CompetitionStandingsTable.svelte";
    import {
        build_competition_bracket,
        is_bracket_stage_type,
    } from "$lib/presentation/logic/competitionBracket";
    import { EMPTY_BRACKET_LAYOUT } from "$lib/presentation/logic/competitionBracketGeometry";
    import {
        RESULTS_VIEW_MODE,
        RESULTS_VIEW_SURFACE,
        type ResultsViewMode,
    } from "$lib/presentation/logic/competitionResultsViewMode";
    import {
        ORDER_PREFERENCE,
        order_stage_results_sections,
        STAGE_ORDER,
        type StageOrder,
    } from "$lib/presentation/logic/competitionStageOrder";
    import type {
        CompetitionStageResultsSection as CompetitionStageSection,
        TeamStanding,
    } from "$lib/presentation/logic/competitionStageResults";

    import CompetitionBracket from "./CompetitionBracket.svelte";
    import CompetitionResultsStandingsLegend from "./CompetitionResultsStandingsLegend.svelte";
    import CompetitionStageResultsSection from "./CompetitionStageResultsSection.svelte";
    import ResultsViewModeToggle from "./ResultsViewModeToggle.svelte";
    import StageOrderToggle from "./StageOrderToggle.svelte";

    export let standings: TeamStanding[];
    export let stage_results_sections: CompetitionStageSection[];
    export let selected_team_id: string;
    export let live_team_ids: Set<string>;
    export let format_date: (date_string: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_team_click: (
        event: CustomEvent<{ team_id: string; team_name: string }>,
    ) => void;
    export let on_open_match_report: (fixture_id: string) => void;

    let stage_order: StageOrder = STAGE_ORDER.ASCENDING;
    let view_mode: ResultsViewMode = RESULTS_VIEW_MODE.LIST;

    $: has_bracket_stages = stage_results_sections.some((section) =>
        is_bracket_stage_type(section.stage.stage_type),
    );
    $: is_bracket_view =
        has_bracket_stages && view_mode === RESULTS_VIEW_MODE.BRACKET;
    $: listed_stage_sections = order_stage_results_sections(
        is_bracket_view
            ? stage_results_sections.filter(
                  (section) => !is_bracket_stage_type(section.stage.stage_type),
              )
            : stage_results_sections,
        stage_order,
    );
    $: bracket_layout = is_bracket_view
        ? build_competition_bracket({
              stages: stage_results_sections.map((section) => section.stage),
              fixtures: stage_results_sections.flatMap(
                  (section) => section.fixtures,
              ),
          })
        : EMPTY_BRACKET_LAYOUT;
    $: is_bracket_first =
        is_bracket_view && stage_order === STAGE_ORDER.DESCENDING;
</script>

{#if stage_results_sections.length === 0}
    <CompetitionStandingsTable
        {standings}
        {selected_team_id}
        {live_team_ids}
        empty_message="No teams registered for this competition yet."
        on:teamclick={on_team_click}
    />
{:else}
    <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-end gap-2">
            {#if stage_results_sections.length > 1}
                <StageOrderToggle
                    preference={ORDER_PREFERENCE.STANDINGS_STAGES}
                    bind:stage_order
                />
            {/if}
            {#if has_bracket_stages}
                <ResultsViewModeToggle
                    surface={RESULTS_VIEW_SURFACE.STANDINGS}
                    bind:view_mode
                />
            {/if}
        </div>
        {#if is_bracket_first}
            <CompetitionBracket
                layout={bracket_layout}
                {get_team_name}
                {get_team_logo_url}
                {on_open_match_report}
            />
        {/if}
        {#each listed_stage_sections as stage_section (stage_section.stage.id)}
            <CompetitionStageResultsSection
                {stage_section}
                {selected_team_id}
                {live_team_ids}
                {format_date}
                {get_team_name}
                {get_team_logo_url}
                {on_team_click}
                {on_open_match_report}
            />
        {/each}
        {#if is_bracket_view && !is_bracket_first}
            <CompetitionBracket
                layout={bracket_layout}
                {get_team_name}
                {get_team_logo_url}
                {on_open_match_report}
            />
        {/if}
        <CompetitionResultsStandingsLegend />
    </div>
{/if}
