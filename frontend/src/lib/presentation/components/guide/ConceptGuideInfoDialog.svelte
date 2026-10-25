<script lang="ts">
    import { get_concept_explanation } from "$lib/presentation/logic/conceptGuideExplanations";
    import { CONCEPT_GUIDE_ICONS } from "$lib/presentation/logic/conceptGuideIcons";
    import type {
        ConceptDefinition,
        ConceptId,
    } from "$lib/presentation/logic/conceptGuideTypes";

    import { KEYBOARD_KEY } from "../ui/keyboardKeys";
    import ConceptGuideConnections from "./ConceptGuideConnections.svelte";
    import ConceptGuideIcon from "./ConceptGuideIcon.svelte";

    export let concept: ConceptDefinition;
    export let can_open_route: boolean;
    export let on_open_concept: (concept_id: ConceptId) => void;
    export let on_close: () => void;

    const CLOSE_ICON_PATH = "M6 18L18 6M6 6l12 12";

    $: explanation = get_concept_explanation(concept.id);

    function handle_keydown(event: KeyboardEvent): void {
        if (event.key === KEYBOARD_KEY.ESCAPE) on_close();
    }
</script>

<svelte:window on:keydown={handle_keydown} />

<div
    class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    role="presentation"
    on:click|self={on_close}
>
    <div
        class="bg-white dark:bg-gray-800 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="concept_info_title"
    >
        <div
            class="sticky top-0 bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3"
        >
            <span class="text-primary-600 dark:text-primary-400">
                <ConceptGuideIcon
                    path={CONCEPT_GUIDE_ICONS[concept.id]}
                    size_class="w-6 h-6"
                />
            </span>
            <h3
                id="concept_info_title"
                class="flex-1 text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
                {concept.name}
            </h3>
            <button
                type="button"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close"
                on:click={on_close}
            >
                <ConceptGuideIcon path={CLOSE_ICON_PATH} />
            </button>
        </div>
        <div class="px-5 py-4 space-y-5">
            <section>
                <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1"
                >
                    What it is
                </h4>
                <p
                    class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                >
                    {explanation.what_it_is}
                </p>
            </section>
            <section>
                <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1"
                >
                    Why it matters
                </h4>
                <p
                    class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                >
                    {explanation.why_it_matters}
                </p>
            </section>
            <section class="grid gap-4 sm:grid-cols-2">
                <ConceptGuideConnections
                    heading="Needs first"
                    empty_text="Nothing. This is where everything starts."
                    connections={concept.needs}
                    on_open={on_open_concept}
                />
                <ConceptGuideConnections
                    heading="Makes possible"
                    empty_text="This is the end result of everything else."
                    connections={concept.unlocks}
                    on_open={on_open_concept}
                />
            </section>
            <section>
                <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2"
                >
                    In practice
                </h4>
                <div class="grid gap-3 sm:grid-cols-2">
                    {#each explanation.scenarios as scenario (scenario.title)}
                        <div
                            class="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3"
                        >
                            <div
                                class="text-sm font-semibold text-accent-900 dark:text-accent-100"
                            >
                                {scenario.title}
                            </div>
                            <p
                                class="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                            >
                                {scenario.story}
                            </p>
                        </div>
                    {/each}
                </div>
            </section>
        </div>
        <div
            class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
        >
            <button
                type="button"
                class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                on:click={on_close}>Close</button
            >
            {#if can_open_route}
                <a
                    href={concept.route}
                    class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[0.175rem]"
                    >Go to {concept.name.toLowerCase()}</a
                >
            {/if}
        </div>
    </div>
</div>
