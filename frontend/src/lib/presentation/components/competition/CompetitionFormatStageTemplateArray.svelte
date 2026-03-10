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

    function handle_reset_to_format_defaults(): boolean {
        if (disabled) return false;
        return emit_change(
            build_stage_template_defaults(format_type, league_config),
        );
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
    <div
        class="flex flex-col gap-3 rounded-lg border border-accent-200 bg-accent-50/40 p-4 dark:border-accent-700 dark:bg-accent-900/30 sm:flex-row sm:items-center sm:justify-between"
    >
        <div>
            <p class="text-sm font-medium text-accent-900 dark:text-accent-100">
                Stage Template
            </p>
            <p class="text-sm text-accent-600 dark:text-accent-300">
                This format defines the initial stages copied into each
                competition.
            </p>
        </div>
        <button
            type="button"
            class="btn btn-outline w-full sm:w-auto"
            on:click={handle_reset_to_format_defaults}
            {disabled}
        >
            Reset From Format Type
        </button>
    </div>

    <div class="space-y-3">
        {#each displayed_stage_templates as stage_template, template_index (template_index)}
            <div
                class="rounded-lg border border-accent-200 bg-white p-4 dark:border-accent-700 dark:bg-accent-900/60"
            >
                <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p
                            class="text-sm font-semibold text-accent-900 dark:text-accent-100"
                        >
                            Stage {template_index + 1}
                        </p>
                        <p class="text-xs text-accent-500 dark:text-accent-400">
                            Order {template_index + 1}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-outline px-3 py-2 text-xs"
                        on:click={() =>
                            handle_remove_stage_template(template_index)}
                        disabled={disabled ||
                            displayed_stage_templates.length <= 1}
                    >
                        Remove
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

    <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
        <button
            type="button"
            class="btn btn-outline w-full sm:w-auto"
            on:click={handle_add_stage_template}
            {disabled}
        >
            Add Stage
        </button>

        {#if error}
            <p class="text-sm text-red-600 dark:text-red-300">{error}</p>
        {/if}
    </div>
</div>
