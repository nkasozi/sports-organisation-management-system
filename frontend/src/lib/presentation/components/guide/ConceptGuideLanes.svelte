<script lang="ts">
    import { get_concepts_in_lane } from "$lib/presentation/logic/conceptGuideCatalog";
    import { GUIDE_LANES } from "$lib/presentation/logic/conceptGuidePageState";
    import type {
        ConceptId,
        ConceptProgress,
    } from "$lib/presentation/logic/conceptGuideTypes";

    import ConceptGuideCard from "./ConceptGuideCard.svelte";

    export let progress: Record<ConceptId, ConceptProgress>;
    export let selected_concept_id: ConceptId;
    export let on_select: (concept_id: ConceptId) => void;
    export let on_info: (concept_id: ConceptId) => void;
</script>

<div class="space-y-5">
    {#each GUIDE_LANES as lane_heading, lane_index (lane_heading.lane)}
        <section>
            <h2
                class="text-sm font-semibold text-accent-800 dark:text-accent-200 mb-2"
            >
                {lane_index + 1}. {lane_heading.title}
                <span class="font-normal text-gray-500 dark:text-gray-400"
                    >· {lane_heading.cadence}</span
                >
            </h2>
            <div
                class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3"
            >
                {#each get_concepts_in_lane(lane_heading.lane) as concept (concept.id)}
                    <ConceptGuideCard
                        {concept}
                        progress={progress[concept.id]}
                        is_selected={selected_concept_id === concept.id}
                        on_select={() => on_select(concept.id)}
                        on_info={() => on_info(concept.id)}
                    />
                {/each}
            </div>
        </section>
    {/each}
</div>
