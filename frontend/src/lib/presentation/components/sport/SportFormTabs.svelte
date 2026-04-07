<script lang="ts">
    import { SPORT_FORM_SECTIONS } from "$lib/presentation/logic/sportFormEditorState";

    export let active_section: string;
</script>

<div
    class="flex overflow-x-auto border-b border-accent-200 dark:border-accent-700"
>
    {#each SPORT_FORM_SECTIONS as current_section}
        <button
            type="button"
            class={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${active_section === current_section.id ? "text-theme-primary-600 dark:text-theme-primary-400 border-b-2 border-theme-primary-500" : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-200"}`}
            on:click={() => (active_section = current_section.id)}
        >
            {current_section.label}
        </button>
    {/each}
</div>
