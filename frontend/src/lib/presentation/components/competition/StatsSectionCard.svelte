<script lang="ts">
    import { STATS_DETAIL_TEXT } from "./competitionResultsDisplayConstants";

    export let title: string;
    export let icon: string;

    let is_expanded = true;

    function toggle_section(): boolean {
        is_expanded = !is_expanded;
        return is_expanded;
    }
</script>

<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        class:mb-4={is_expanded}
    >
        <button
            type="button"
            class="flex items-center gap-2 text-left text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 shrink-0"
            aria-expanded={is_expanded}
            title={is_expanded
                ? STATS_DETAIL_TEXT.COLLAPSE_SECTION
                : STATS_DETAIL_TEXT.EXPAND_SECTION}
            on:click={toggle_section}
        >
            <svg
                class="w-4 h-4 text-accent-400 transition-transform {is_expanded
                    ? ''
                    : '-rotate-90'}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 9-7 7-7-7"
                /></svg
            >
            <span>{icon}</span>
            {title}
        </button>
        {#if is_expanded}
            <slot name="actions" />
        {/if}
    </div>
    {#if is_expanded}
        <slot />
    {/if}
</div>
