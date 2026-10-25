<script lang="ts">
    import { CONCEPT_GUIDE_ICONS } from "$lib/presentation/logic/conceptGuideIcons";
    import {
        CONCEPT_STATUS,
        type ConceptDefinition,
        type ConceptProgress,
    } from "$lib/presentation/logic/conceptGuideTypes";

    import ConceptGuideIcon from "./ConceptGuideIcon.svelte";
    import ConceptGuideInfoButton from "./ConceptGuideInfoButton.svelte";
    import { CONCEPT_STATUS_STYLES } from "./conceptGuideStyles";

    export let concept: ConceptDefinition;
    export let progress: ConceptProgress;
    export let is_selected: boolean;
    export let on_select: () => void;
    export let on_info: () => void;

    $: is_locked = progress.status === CONCEPT_STATUS.LOCKED;
    $: status_style = CONCEPT_STATUS_STYLES[progress.status];
</script>

<div
    class={`relative rounded-lg border p-3 transition-colors ${is_selected ? "border-primary-500 ring-1 ring-primary-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"} ${is_locked ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"}`}
>
    <div class="flex items-center justify-between gap-2">
        <span
            class={is_locked
                ? "text-gray-400"
                : "text-primary-600 dark:text-primary-400"}
        >
            <ConceptGuideIcon path={CONCEPT_GUIDE_ICONS[concept.id]} />
        </span>
        <div class="relative z-10 flex items-center gap-1">
            <span
                class={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status_style.classes}`}
                >{status_style.label}</span
            >
            <ConceptGuideInfoButton
                concept_name={concept.name}
                on_click={on_info}
            />
        </div>
    </div>
    <button
        type="button"
        class="mt-2 block w-full text-left after:absolute after:inset-0"
        on:click={on_select}
    >
        <span
            class={`block font-semibold text-sm ${is_locked ? "text-gray-500 dark:text-gray-400" : "text-accent-900 dark:text-accent-100"}`}
            >{concept.name}</span
        >
        <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5"
            >{progress.detail}</span
        >
    </button>
</div>
