<script lang="ts">
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
    import DynamicEntityList from "$lib/presentation/components/DynamicEntityList.svelte";

    export let competition_stage_filter: SubEntityFilter;
    export let can_edit_competition: boolean;
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Competition Stages
        </h3>
        <p class="mt-1 text-sm text-accent-600 dark:text-accent-400">
            Every competition format is stage-based. Fixtures attach to a stage,
            and group membership is inferred later from the stage's fixtures.
        </p>
    </div>
    <DynamicEntityList
        entity_type="competitionstage"
        sub_entity_filter={competition_stage_filter}
        disabled_functionalities={can_edit_competition
            ? []
            : ["create", "edit", "delete"]}
    />
</div>
