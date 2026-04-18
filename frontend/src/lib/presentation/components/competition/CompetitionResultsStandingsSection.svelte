<script lang="ts">
    import CompetitionStandingsTable from "$lib/presentation/components/competition/CompetitionStandingsTable.svelte";
    import type {
        CompetitionStageResultsSection as CompetitionStageSection,
        TeamStanding,
    } from "$lib/presentation/logic/competitionStageResults";

    import CompetitionResultsStandingsLegend from "./CompetitionResultsStandingsLegend.svelte";
    import CompetitionStageResultsSection from "./CompetitionStageResultsSection.svelte";

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
        {#each stage_results_sections as stage_section}
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
        <CompetitionResultsStandingsLegend />
    </div>
{/if}
