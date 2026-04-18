<script lang="ts">
    import CompetitionStandingsTable from "$lib/presentation/components/competition/CompetitionStandingsTable.svelte";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";
    import type { CompetitionStageResultsSection as CompetitionStageSection } from "$lib/presentation/logic/competitionStageResults";

    export let stage_section: CompetitionStageSection;
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

<section
    class="rounded-xl border border-accent-200 dark:border-accent-700 p-4 sm:p-5"
>
    <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4"
    >
        <div>
            <h3
                class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
                {stage_section.stage.name}
            </h3>
            <p class="text-sm text-accent-600 dark:text-accent-400">
                {stage_section.fixtures.length} fixture{stage_section.fixtures
                    .length === 1
                    ? ""
                    : "s"} attached to this stage
            </p>
        </div>
        <span
            class="inline-flex items-center rounded-full bg-accent-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-700 dark:bg-accent-800 dark:text-accent-300"
            >{stage_section.stage.stage_type.replaceAll("_", " ")}</span
        >
    </div>

    {#if stage_section.stage.stage_type === "group_stage"}
        {#if stage_section.inferred_groups.length === 0}
            <div class="text-center py-8 text-accent-500">
                No groups can be inferred for this stage yet.
            </div>
        {:else}
            <div class="space-y-6">
                {#each stage_section.inferred_groups as inferred_group}
                    <div
                        class="rounded-lg bg-accent-50/70 p-4 dark:bg-accent-900/20"
                    >
                        <div
                            class="mb-3 flex items-center justify-between gap-3"
                        >
                            <h4
                                class="text-base font-semibold text-accent-900 dark:text-accent-100"
                            >
                                {inferred_group.label}
                            </h4>
                            <span
                                class="text-xs text-accent-600 dark:text-accent-400"
                                >{inferred_group.team_ids.length} teams</span
                            >
                        </div>
                        <CompetitionStandingsTable
                            standings={inferred_group.standings}
                            {selected_team_id}
                            {live_team_ids}
                            empty_message="No completed fixtures in this inferred group yet."
                            show_legend={false}
                            on:teamclick={on_team_click}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    {:else if stage_section.stage.stage_type === "knockout_stage" || stage_section.stage.stage_type === "one_off_stage"}
        {#if stage_section.fixtures.length === 0}
            <div class="text-center py-8 text-accent-500 dark:text-accent-400">
                No fixtures assigned to this stage yet.
            </div>
        {:else}
            <div class="space-y-3">
                {#each stage_section.fixtures.sort((left, right) => new Date(left.scheduled_date).getTime() - new Date(right.scheduled_date).getTime()) as fixture}
                    {@const home_score = fixture.home_team_score ?? 0}
                    {@const away_score = fixture.away_team_score ?? 0}
                    <div
                        class="w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors"
                    >
                        <div
                            class="text-xs text-center text-gray-500 dark:text-gray-400 mb-2"
                        >
                            {format_date(fixture.scheduled_date)}
                        </div>
                        <div class="flex items-center justify-between gap-2">
                            <div
                                class="flex-1 flex items-center justify-end gap-1.5"
                            >
                                <span
                                    class={`text-sm sm:text-base font-medium line-clamp-1 ${home_score > away_score && fixture.status === "completed" ? "text-green-600 dark:text-green-400" : "text-accent-900 dark:text-accent-100"}`}
                                    >{get_team_name(fixture.home_team_id)}</span
                                ><TeamLogoThumbnail
                                    logo_url={get_team_logo_url(
                                        fixture.home_team_id,
                                    )}
                                    team_name={get_team_name(
                                        fixture.home_team_id,
                                    )}
                                    size="sm"
                                />
                            </div>
                            <div class="flex-shrink-0 px-2 sm:px-4">
                                {#if fixture.status === "completed" || fixture.status === "in_progress"}
                                    <div
                                        class="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold"
                                    >
                                        <span
                                            class={home_score > away_score
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-accent-900 dark:text-accent-100"}
                                            >{home_score}</span
                                        ><span
                                            class="text-gray-400 text-base sm:text-lg"
                                            >-</span
                                        ><span
                                            class={away_score > home_score
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-accent-900 dark:text-accent-100"}
                                            >{away_score}</span
                                        >
                                    </div>
                                {:else}
                                    <span
                                        class="text-sm font-bold text-gray-400 px-2"
                                        >VS</span
                                    >
                                {/if}
                            </div>
                            <div class="flex-1 flex items-center gap-1.5">
                                <TeamLogoThumbnail
                                    logo_url={get_team_logo_url(
                                        fixture.away_team_id,
                                    )}
                                    team_name={get_team_name(
                                        fixture.away_team_id,
                                    )}
                                    size="sm"
                                /><span
                                    class={`text-sm sm:text-base font-medium line-clamp-1 ${away_score > home_score && fixture.status === "completed" ? "text-green-600 dark:text-green-400" : "text-accent-900 dark:text-accent-100"}`}
                                    >{get_team_name(fixture.away_team_id)}</span
                                >
                            </div>
                        </div>
                        <div
                            class="flex justify-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                        >
                            <button
                                type="button"
                                class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                on:click={() =>
                                    on_open_match_report(fixture.id)}
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    /><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    /></svg
                                >
                                View Details
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {:else}
        <CompetitionStandingsTable
            standings={stage_section.standings}
            {selected_team_id}
            {live_team_ids}
            empty_message="No standings are available for this stage yet."
            show_legend={false}
            on:teamclick={on_team_click}
        />
    {/if}
</section>
