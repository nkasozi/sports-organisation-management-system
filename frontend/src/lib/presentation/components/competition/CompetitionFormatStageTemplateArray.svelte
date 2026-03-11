<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type {
        CompetitionFormatStageTemplate,
        FormatType,
        LeagueConfig,
    } from "$lib/core/entities/CompetitionFormat";
    import { STAGE_TYPE_OPTIONS } from "$lib/core/entities/CompetitionStage";
    import {
        add_stage_template,
        build_stage_template_defaults,
        is_stage_type,
        remove_stage_template_at_index,
        update_stage_template_at_index,
    } from "$lib/presentation/logic/competitionFormatStageTemplateLogic";

    export let stage_templates: CompetitionFormatStageTemplate[] = [];
    export let format_type: FormatType = "league";
    export let league_config: LeagueConfig | null = null;
    export let disabled: boolean = false;
    export let error: string = "";

    const dispatch = createEventDispatcher<{
        change: { stage_templates: CompetitionFormatStageTemplate[] };
    }>();

    $: displayed_stage_templates =
        stage_templates.length > 0
            ? stage_templates
            : build_stage_template_defaults(format_type, league_config);

    function emit_change(
        updated_stage_templates: CompetitionFormatStageTemplate[],
    ): boolean {
        dispatch("change", { stage_templates: updated_stage_templates });
        return true;
    }

    function handle_add_stage_template(): boolean {
        if (disabled) return false;
        return emit_change(add_stage_template(displayed_stage_templates));
    }

    function handle_remove_stage_template(template_index: number): boolean {
        if (disabled) return false;
        if (displayed_stage_templates.length <= 1) return false;
        return emit_change(
            remove_stage_template_at_index(
                displayed_stage_templates,
                template_index,
            ),
        );
    }

    function handle_stage_name_change(
        template_index: number,
        template_name: string,
    ): boolean {
        return emit_change(
            update_stage_template_at_index(
                displayed_stage_templates,
                template_index,
                {
                    name: template_name,
                },
            ),
        );
    }

    function handle_stage_type_change(
        template_index: number,
        stage_type_value: string,
    ): boolean {
        if (!is_stage_type(stage_type_value)) return false;

        return emit_change(
            update_stage_template_at_index(
                displayed_stage_templates,
                template_index,
                {
                    stage_type: stage_type_value,
                },
            ),
        );
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
        <span
            class="block text-sm font-medium text-accent-700 dark:text-accent-300"
        >
            Stage Templates
        </span>
        <div class="flex items-center gap-2">
            <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       bg-accent-600 text-white hover:bg-accent-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
                on:click={handle_add_stage_template}
                {disabled}
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                Add Stage
            </button>
        </div>
    </div>

    {#if error}
        <p class="text-sm text-red-600 dark:text-red-300">{error}</p>
    {/if}

    <div class="space-y-3">
        {#each displayed_stage_templates as stage_template, template_index (template_index)}
            <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            >
                <div class="flex items-start justify-between mb-3">
                    <span
                        class="text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                        Stage {template_index + 1}
                    </span>
                    <button
                        type="button"
                        class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                               hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        on:click={() =>
                            handle_remove_stage_template(template_index)}
                        disabled={disabled ||
                            displayed_stage_templates.length <= 1}
                        title="Remove this stage"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div class="space-y-2">
                        <label
                            class="label"
                            for={`stage_template_name_${template_index}`}
                        >
                            Stage Name
                        </label>
                        <input
                            id={`stage_template_name_${template_index}`}
                            type="text"
                            class="input"
                            value={stage_template.name}
                            on:input={(event) =>
                                handle_stage_name_change(
                                    template_index,
                                    (event.currentTarget as HTMLInputElement)
                                        .value,
                                )}
                            readonly={disabled}
                            placeholder="Stage name"
                        />
                    </div>

                    <div class="space-y-2">
                        <label
                            class="label"
                            for={`stage_template_type_${template_index}`}
                        >
                            Stage Type
                        </label>
                        <select
                            id={`stage_template_type_${template_index}`}
                            class="input"
                            value={stage_template.stage_type}
                            on:change={(event) =>
                                handle_stage_type_change(
                                    template_index,
                                    (event.currentTarget as HTMLSelectElement)
                                        .value,
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
        {/each}
    </div>
</div>
