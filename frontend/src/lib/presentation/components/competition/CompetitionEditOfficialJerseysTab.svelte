<script lang="ts">
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
    import DynamicEntityList from "$lib/presentation/components/DynamicEntityList.svelte";

    export let official_jersey_filter: SubEntityFilter;
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div>
            <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
            >
                Official Jersey Colors
            </h3>
            <p class="text-sm text-accent-500 dark:text-accent-400">
                Configure the jersey color options for officials in this
                competition
            </p>
        </div>
    </div>
    <DynamicEntityList
        entity_type="jerseycolor"
        sub_entity_filter={official_jersey_filter}
        show_actions={true}
    />
</div>
