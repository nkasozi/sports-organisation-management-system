<script lang="ts">
    import { INFO_ICON_PATH } from "$lib/presentation/logic/conceptGuideIcons";

    import ConceptGuideIcon from "./ConceptGuideIcon.svelte";

    export let concept_name: string;
    export let on_click: () => void;
</script>

<button
    type="button"
    class="p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-gray-700 transition-colors"
    aria-label={`What is ${concept_name}?`}
    title={`What is ${concept_name}?`}
    on:click|stopPropagation={on_click}
>
    <ConceptGuideIcon path={INFO_ICON_PATH} />
</button>
