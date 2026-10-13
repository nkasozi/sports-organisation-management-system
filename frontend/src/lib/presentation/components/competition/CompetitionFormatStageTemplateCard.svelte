<script lang="ts">
    import type { CompetitionFormatStageTemplate } from "$lib/core/entities/CompetitionFormat";
    import { STAGE_TYPE_OPTIONS } from "$lib/core/entities/CompetitionStage";
    import type { ScalarInput } from "$lib/core/types/DomainScalars";

    export let stage_template: ScalarInput<CompetitionFormatStageTemplate>;
    export let template_index: number;
    export let disabled: boolean = false;
    export let is_only_template: boolean = false;
    export let on_remove: (template_index: number) => boolean;
    export let on_name_change: (
        template_index: number,
        template_name: string,
    ) => boolean;
    export let on_type_change: (
        template_index: number,
        stage_type_value: string,
    ) => boolean;
</script>

<div
    class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
>
    <div class="flex items-start justify-between mb-3">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Stage {template_index + 1}
        </span>
        <button
            type="button"
            class="rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
            on:click={() => on_remove(template_index)}
            disabled={disabled || is_only_template}
            title="Remove this stage"
        >
            <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                /></svg
            >
        </button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="space-y-2">
            <label class="label" for={`stage_template_name_${template_index}`}>
                Stage Name
            </label>
            <input
                id={`stage_template_name_${template_index}`}
                type="text"
                class="input"
                value={stage_template.name}
                on:input={(event) =>
                    on_name_change(
                        template_index,
                        (event.currentTarget as HTMLInputElement).value,
                    )}
                readonly={disabled}
                placeholder="Stage name"
            />
        </div>

        <div class="space-y-2">
            <label class="label" for={`stage_template_type_${template_index}`}>
                Stage Type
            </label>
            <select
                id={`stage_template_type_${template_index}`}
                class="input"
                value={stage_template.stage_type}
                on:change={(event) =>
                    on_type_change(
                        template_index,
                        (event.currentTarget as HTMLSelectElement).value,
                    )}
                {disabled}
            >
                {#each STAGE_TYPE_OPTIONS as stage_type_option}
                    <option value={stage_type_option.value}>
                        {stage_type_option.label}
                    </option>
                {/each}
            </select>
        </div>
    </div>
</div>
