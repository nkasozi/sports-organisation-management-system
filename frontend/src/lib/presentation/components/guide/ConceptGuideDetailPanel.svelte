<script lang="ts">
    import { CONCEPT_GUIDE_ICONS } from "$lib/presentation/logic/conceptGuideIcons";
    import {
        CONCEPT_STATUS,
        type ConceptDefinition,
        type ConceptId,
        type ConceptProgress,
    } from "$lib/presentation/logic/conceptGuideTypes";

    import ConceptGuideConnections from "./ConceptGuideConnections.svelte";
    import ConceptGuideIcon from "./ConceptGuideIcon.svelte";
    import ConceptGuideInfoButton from "./ConceptGuideInfoButton.svelte";
    import { CONCEPT_STATUS_STYLES } from "./conceptGuideStyles";

    export let concept: ConceptDefinition;
    export let progress: ConceptProgress;
    export let can_open_route: boolean;
    export let on_select_concept: (concept_id: ConceptId) => void;
    export let on_info: () => void;

    $: status_style = CONCEPT_STATUS_STYLES[progress.status];
</script>

<section
    class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5"
    aria-live="polite"
>
    <div class="flex items-center gap-3">
        <span class="text-primary-600 dark:text-primary-400">
            <ConceptGuideIcon
                path={CONCEPT_GUIDE_ICONS[concept.id]}
                size_class="w-6 h-6"
            />
        </span>
        <h2
            class="flex-1 text-lg font-semibold text-accent-900 dark:text-accent-100"
        >
            {concept.name}
        </h2>
        <span
            class={`text-xs font-medium px-2 py-0.5 rounded-full ${status_style.classes}`}
            >{status_style.label}</span
        >
        <ConceptGuideInfoButton
            concept_name={concept.name}
            on_click={on_info}
        />
    </div>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {concept.summary}
        <button
            type="button"
            class="text-primary-600 dark:text-primary-400 hover:underline"
            on:click={on_info}>Why it matters and examples</button
        >
    </p>
    <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <ConceptGuideConnections
            heading="Needs first"
            empty_text="Nothing. Start here."
            connections={concept.needs}
            on_open={on_select_concept}
        />
        <ConceptGuideConnections
            heading="Makes possible"
            empty_text="The end of the line."
            connections={concept.unlocks}
            on_open={on_select_concept}
        />
        <div>
            <h4
                class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2"
            >
                Where you are
            </h4>
            <p class="text-sm font-medium text-accent-900 dark:text-accent-100">
                {progress.detail}
            </p>
        </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-3">
        {#if progress.status === CONCEPT_STATUS.LOCKED}
            <span class="text-sm text-amber-700 dark:text-amber-300"
                >Finish what it needs first, then come back here.</span
            >
        {:else if can_open_route}
            <a
                href={concept.route}
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[0.175rem]"
                >Go to {concept.name.toLowerCase()}</a
            >
        {:else}
            <span class="text-sm text-gray-500 dark:text-gray-400"
                >Your role can't manage {concept.name.toLowerCase()}. Ask an
                organization admin.</span
            >
        {/if}
    </div>
</section>
