<script lang="ts">
    import { onMount } from "svelte";

    import { get_concept_definition } from "$lib/presentation/logic/conceptGuideCatalog";
    import { load_current_user_concept_snapshot } from "$lib/presentation/logic/conceptGuideCurrentUser";
    import { find_next_concept_step } from "$lib/presentation/logic/conceptGuideNextStep";
    import { build_guide_route_checker } from "$lib/presentation/logic/conceptGuidePageState";
    import type {
        ConceptId,
        ConceptNextStep,
    } from "$lib/presentation/logic/conceptGuideTypes";
    import { sidebar_menu_items } from "$lib/presentation/stores/authDerivedStores";

    import ConceptGuideInfoDialog from "../guide/ConceptGuideInfoDialog.svelte";
    import ConceptGuideNextStep from "../guide/ConceptGuideNextStep.svelte";

    const NOT_LOADED = "";

    let next_step: ConceptNextStep | typeof NOT_LOADED = NOT_LOADED;
    let info_concept_id: ConceptId | typeof NOT_LOADED = NOT_LOADED;

    $: can_open = build_guide_route_checker($sidebar_menu_items);

    onMount(async () => {
        next_step = find_next_concept_step(
            await load_current_user_concept_snapshot(),
        );
    });
</script>

{#if next_step !== NOT_LOADED}
    {@const next_concept = get_concept_definition(next_step.concept_id)}
    {@const current_step = next_step}
    <div class="space-y-1">
        <ConceptGuideNextStep
            next_step={current_step}
            route={next_concept.route}
            can_open_route={can_open(next_concept.route)}
            on_show_concept={() => (info_concept_id = current_step.concept_id)}
        />
        <div class="text-right">
            <a
                href="/how-it-works"
                class="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                >See how it all fits together →</a
            >
        </div>
    </div>
{/if}

{#if info_concept_id !== NOT_LOADED}
    <ConceptGuideInfoDialog
        concept={get_concept_definition(info_concept_id)}
        can_open_route={can_open(get_concept_definition(info_concept_id).route)}
        on_open_concept={(concept_id) => (info_concept_id = concept_id)}
        on_close={() => (info_concept_id = NOT_LOADED)}
    />
{/if}
