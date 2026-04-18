<script lang="ts">
    import type { HelpSectionExpansionState } from "$lib/presentation/logic/helpPageState";

    import {
        HELP_GUIDE_SECTION_DESCRIPTION,
        HELP_GUIDE_SECTION_ID,
        HELP_GUIDE_SECTION_TITLE,
    } from "../../logic/helpPageContent";
    import { HELP_GUIDE_STEPS } from "../../logic/helpPageGuideSteps";

    export let expanded_guide_state: HelpSectionExpansionState;
    export let on_toggle: (selected_index: number) => void;

    function is_guide_step_expanded(selected_index: number): boolean {
        return (
            expanded_guide_state.status === "expanded" &&
            expanded_guide_state.index === selected_index
        );
    }
</script>

<div id={HELP_GUIDE_SECTION_ID} class="card">
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
        <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
            {HELP_GUIDE_SECTION_TITLE}
        </h2>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            {HELP_GUIDE_SECTION_DESCRIPTION}
        </p>
    </div>
    <div class="divide-y divide-accent-200 dark:divide-accent-700">
        {#each HELP_GUIDE_STEPS as current_step, current_index}
            <div class="p-0">
                <button
                    type="button"
                    class="w-full px-6 py-4 text-left flex items-start gap-4 hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
                    on:click={() => on_toggle(current_index)}
                    aria-expanded={is_guide_step_expanded(current_index)}
                    aria-label={`Step ${current_step.step_number}: ${current_step.title}`}
                >
                    <div
                        class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${is_guide_step_expanded(current_index) ? "bg-theme-primary-500 text-white" : "bg-accent-200 dark:bg-accent-700 text-accent-700 dark:text-accent-300"}`}
                    >
                        {current_step.step_number}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h3
                                class="font-medium text-accent-900 dark:text-accent-100"
                            >
                                {current_step.title}
                            </h3>
                            <svg
                                class={`h-5 w-5 text-accent-500 transform transition-transform flex-shrink-0 ml-2 ${is_guide_step_expanded(current_index) ? "rotate-180" : ""}`}
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
                        </div>
                        <p
                            class="text-sm text-accent-600 dark:text-accent-400 mt-1"
                        >
                            {current_step.description}
                        </p>
                    </div>
                </button>
                {#if is_guide_step_expanded(current_index)}
                    <div class="px-6 pb-4 pl-18">
                        <div class="ml-12 space-y-2">
                            <ul class="space-y-2">
                                {#each current_step.details as current_detail}
                                    <li
                                        class="flex items-start gap-2 text-sm text-accent-600 dark:text-accent-400"
                                    >
                                        <svg
                                            class="h-4 w-4 text-theme-primary-500 mt-0.5 flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                        <span>{current_detail}</span>
                                    </li>
                                {/each}
                            </ul>
                            <a
                                href={current_step.link}
                                class="inline-flex items-center mt-3 text-sm font-medium text-theme-primary-600 dark:text-theme-primary-400 hover:text-theme-primary-700 dark:hover:text-theme-primary-300"
                            >
                                {`Go to ${current_step.title}`}
                                <svg
                                    class="ml-1 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>
