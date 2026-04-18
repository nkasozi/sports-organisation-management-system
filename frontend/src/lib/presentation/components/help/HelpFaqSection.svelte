<script lang="ts">
    import type { HelpSectionExpansionState } from "$lib/presentation/logic/helpPageState";

    import {
        HELP_FAQ_ITEMS,
        HELP_FAQ_SECTION_ID,
        HELP_FAQ_SECTION_TITLE,
    } from "../../logic/helpPageContent";

    export let expanded_faq_state: HelpSectionExpansionState;
    export let on_toggle: (selected_index: number) => void;

    function is_faq_item_expanded(selected_index: number): boolean {
        return (
            expanded_faq_state.status === "expanded" &&
            expanded_faq_state.index === selected_index
        );
    }
</script>

<div id={HELP_FAQ_SECTION_ID} class="card">
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
        <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
            {HELP_FAQ_SECTION_TITLE}
        </h2>
    </div>
    <div class="divide-y divide-accent-200 dark:divide-accent-700">
        {#each HELP_FAQ_ITEMS as current_item, current_index}
            <div class="p-0">
                <button
                    type="button"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
                    on:click={() => on_toggle(current_index)}
                    aria-expanded={is_faq_item_expanded(current_index)}
                >
                    <span
                        class="font-medium text-accent-900 dark:text-accent-100"
                        >{current_item.question}</span
                    >
                    <svg
                        class={`h-5 w-5 text-accent-500 transform transition-transform ${is_faq_item_expanded(current_index) ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
                {#if is_faq_item_expanded(current_index)}
                    <div class="px-6 pb-4">
                        <p class="text-accent-600 dark:text-accent-400">
                            {current_item.answer}
                        </p>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>
