<script lang="ts">
    import type { CompetitionStageResultsSection as CompetitionStageSection } from "$lib/presentation/logic/competitionStageResults";

    export let stage_section: CompetitionStageSection;
</script>

<div
    class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4"
>
    <div>
        <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
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
