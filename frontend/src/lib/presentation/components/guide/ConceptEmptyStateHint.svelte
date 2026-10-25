<script lang="ts">
    import { onMount } from "svelte";

    import { get_concept_definition } from "$lib/presentation/logic/conceptGuideCatalog";
    import { load_current_user_concept_snapshot } from "$lib/presentation/logic/conceptGuideCurrentUser";
    import {
        type ConceptNeed,
        list_concept_needs,
    } from "$lib/presentation/logic/conceptGuideNeeds";
    import { find_concept_for_entity_type } from "$lib/presentation/logic/conceptGuideOverview";
    import { build_guide_route_checker } from "$lib/presentation/logic/conceptGuidePageState";
    import { build_concept_progress } from "$lib/presentation/logic/conceptGuideProgress";
    import type { ConceptId } from "$lib/presentation/logic/conceptGuideTypes";
    import { sidebar_menu_items } from "$lib/presentation/stores/authDerivedStores";

    import ConceptGuideInfoButton from "./ConceptGuideInfoButton.svelte";
    import ConceptGuideInfoDialog from "./ConceptGuideInfoDialog.svelte";

    export let entity_type: string;

    const NO_CONCEPT = "";

    let needs: ConceptNeed[] = [];
    let info_concept_id: ConceptId | typeof NO_CONCEPT = NO_CONCEPT;

    $: concept_id = find_concept_for_entity_type(entity_type);
    $: can_open = build_guide_route_checker($sidebar_menu_items);
    $: missing_needs = needs.filter((need) => !need.is_met);

    onMount(async () => {
        if (!concept_id) return;
        const progress = build_concept_progress(
            await load_current_user_concept_snapshot(),
        );
        needs = list_concept_needs(concept_id, progress);
    });
</script>

{#if concept_id}
    {@const concept = get_concept_definition(concept_id)}
    {@const current_concept_id = concept_id}
    <div
        class="mx-auto max-w-lg text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3"
    >
        <div class="flex items-start gap-2">
            <p class="flex-1 text-sm text-gray-700 dark:text-gray-200">
                <span class="font-semibold">{concept.name}:</span>
                {concept.summary}
            </p>
            <ConceptGuideInfoButton
                concept_name={concept.name}
                on_click={() => (info_concept_id = current_concept_id)}
            />
        </div>
        {#if needs.length > 0}
            <ul class="space-y-1.5">
                {#each needs as need (need.concept_id)}
                    <li class="flex items-start gap-2 text-sm">
                        <span
                            class={need.is_met
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"}
                            aria-hidden="true">{need.is_met ? "✓" : "!"}</span
                        >
                        <span class="text-gray-700 dark:text-gray-200">
                            <span class="font-medium">{need.name}</span>
                            <span class="text-gray-500 dark:text-gray-400">
                                — {need.reason}</span
                            >
                            {#if !need.is_met && can_open(need.route)}
                                <a
                                    href={need.route}
                                    class="ml-1 text-primary-600 dark:text-primary-400 hover:underline"
                                    >Set up {need.name.toLowerCase()} →</a
                                >
                            {/if}
                        </span>
                    </li>
                {/each}
            </ul>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                {missing_needs.length === 0
                    ? "Everything it needs is in place, so you can create the first one now."
                    : `Set up ${missing_needs.map((need) => need.name.toLowerCase()).join(" and ")} first.`}
                <a href="/how-it-works" class="hover:underline"
                    >See how it all fits together</a
                >
            </p>
        {/if}
    </div>
{/if}

{#if info_concept_id !== NO_CONCEPT}
    <ConceptGuideInfoDialog
        concept={get_concept_definition(info_concept_id)}
        can_open_route={can_open(get_concept_definition(info_concept_id).route)}
        on_open_concept={(next_concept_id) =>
            (info_concept_id = next_concept_id)}
        on_close={() => (info_concept_id = NO_CONCEPT)}
    />
{/if}
