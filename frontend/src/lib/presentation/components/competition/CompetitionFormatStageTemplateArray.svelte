<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import type {
        CompetitionFormatStageTemplate,
        FormatType,
        LeagueConfig,
    } from "$lib/core/entities/CompetitionFormat";
    import { create_default_league_config } from "$lib/core/entities/CompetitionFormatFactories";
    import type { ScalarInput } from "$lib/core/types/DomainScalars";
    import {
        add_stage_template,
        build_stage_template_defaults,
        is_stage_type,
        remove_stage_template_at_index,
        update_stage_template_at_index,
    } from "$lib/presentation/logic/competitionFormatStageTemplateLogic";

    import CompetitionFormatStageTemplateCard from "./CompetitionFormatStageTemplateCard.svelte";

    type EditableCompetitionFormatStageTemplate =
        ScalarInput<CompetitionFormatStageTemplate>;

    export let stage_templates: EditableCompetitionFormatStageTemplate[] = [];
    export let format_type: FormatType = "league";
    export let league_config: LeagueConfig = create_default_league_config();
    export let disabled: boolean = false;
    export let error: string = "";

    const dispatch = createEventDispatcher<{
        change: { stage_templates: EditableCompetitionFormatStageTemplate[] };
    }>();

    $: displayed_stage_templates =
        stage_templates.length > 0
            ? stage_templates
            : build_stage_template_defaults(format_type, league_config);

    function emit_change(
        updated_stage_templates: EditableCompetitionFormatStageTemplate[],
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
                { name: template_name },
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
                { stage_type: stage_type_value },
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
                class="inline-flex items-center gap-1.5 rounded-[0.175rem] bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                on:click={handle_add_stage_template}
                {disabled}
            >
                <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    /></svg
                >
                Add Stage
            </button>
        </div>
    </div>

    {#if error}
        <p class="text-sm text-red-600 dark:text-red-300">{error}</p>
    {/if}

    <div class="space-y-3">
        {#each displayed_stage_templates as stage_template, template_index (template_index)}
            <CompetitionFormatStageTemplateCard
                {stage_template}
                {template_index}
                {disabled}
                is_only_template={displayed_stage_templates.length <= 1}
                on_remove={handle_remove_stage_template}
                on_name_change={handle_stage_name_change}
                on_type_change={handle_stage_type_change}
            />
        {/each}
    </div>
</div>
