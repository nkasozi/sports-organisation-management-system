<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import type { SportPresetType } from "$lib/presentation/logic/sportFormEditorState";

    import SportBasicSection from "./SportBasicSection.svelte";
    import SportCardTypesSection from "./SportCardTypesSection.svelte";
    import SportFormActions from "./SportFormActions.svelte";
    import SportFormHeader from "./SportFormHeader.svelte";
    import {
        SPORT_FORM_SECTION,
        type SportFormSectionId,
    } from "./sportFormSectionConstants";
    import SportFormTabs from "./SportFormTabs.svelte";
    import SportFoulCategoriesSection from "./SportFoulCategoriesSection.svelte";
    import SportOfficialsSection from "./SportOfficialsSection.svelte";
    import SportOvertimeSection from "./SportOvertimeSection.svelte";
    import SportPeriodsSection from "./SportPeriodsSection.svelte";
    import SportScoringSection from "./SportScoringSection.svelte";
    import SportSubstitutionsSection from "./SportSubstitutionsSection.svelte";

    export let title: string;
    export let form_data: CreateSportInput;
    export let errors: Record<string, string>;
    export let is_saving: boolean;
    export let submit_label: string;
    export let saving_label: string;
    export let show_presets: boolean;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_apply_preset:
        | ((preset_type: SportPresetType) => void)
        | undefined = undefined;

    let active_section: SportFormSectionId = SPORT_FORM_SECTION.BASIC;
</script>

<div class="space-y-6">
    <SportFormHeader {title} {show_presets} {on_cancel} {on_apply_preset} />

    <div
        class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 sm:mx-0 sm:border sm:rounded-lg overflow-hidden"
    >
        <SportFormTabs bind:active_section />

        <form
            class="px-4 py-6 sm:px-6"
            on:submit|preventDefault={() => void on_submit()}
        >
            {#if active_section === SPORT_FORM_SECTION.BASIC}
                <SportBasicSection bind:form_data {errors} />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.PERIODS}
                <SportPeriodsSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.CARDS}
                <SportCardTypesSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.FOULS}
                <SportFoulCategoriesSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.OFFICIALS}
                <SportOfficialsSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.SCORING}
                <SportScoringSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.OVERTIME}
                <SportOvertimeSection bind:form_data />
            {/if}
            {#if active_section === SPORT_FORM_SECTION.SUBSTITUTIONS}
                <SportSubstitutionsSection bind:form_data />
            {/if}

            <SportFormActions
                {is_saving}
                {submit_label}
                {saving_label}
                {on_cancel}
            />
        </form>
    </div>
</div>
