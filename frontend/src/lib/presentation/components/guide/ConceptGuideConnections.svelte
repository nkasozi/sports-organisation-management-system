<script lang="ts">
    import { get_concept_definition } from "$lib/presentation/logic/conceptGuideCatalog";
    import type {
        ConceptConnection,
        ConceptId,
    } from "$lib/presentation/logic/conceptGuideTypes";

    export let heading: string;
    export let empty_text: string;
    export let connections: ConceptConnection[];
    export let on_open: (concept_id: ConceptId) => void;
</script>

<div>
    <h4
        class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2"
    >
        {heading}
    </h4>
    {#if connections.length === 0}
        <p class="text-sm text-gray-500 dark:text-gray-400">{empty_text}</p>
    {:else}
        <ul class="space-y-2">
            {#each connections as connection (connection.concept_id)}
                <li class="text-sm">
                    <button
                        type="button"
                        class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        on:click={() => on_open(connection.concept_id)}
                        >{get_concept_definition(connection.concept_id)
                            .name}</button
                    >
                    <span class="text-gray-600 dark:text-gray-300">
                        — {connection.reason}</span
                    >
                </li>
            {/each}
        </ul>
    {/if}
</div>
