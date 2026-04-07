<script lang="ts">
  import type {
    BaseEntity,
    FieldMetadata,
  } from "$lib/core/entities/BaseEntity";
  import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import { build_sub_entity_filter } from "$lib/presentation/logic/dynamicFormLogic";

  import DynamicEntityList from "../DynamicEntityList.svelte";

  export let sub_entity_fields: FieldMetadata[] = [];
  export let is_edit_mode: boolean = false;
  export let entity_data: Partial<BaseEntity> | null = null;
  export let build_sub_entity_handlers: (
    child_entity_type: string,
    sub_filter: SubEntityFilter,
  ) => EntityCrudHandlers;
</script>

{#each sub_entity_fields as sub_entity_field}
  {#if is_edit_mode && entity_data?.id}
    {@const sub_filter = build_sub_entity_filter(sub_entity_field, entity_data)}
    {@const sub_entity_handlers =
      sub_filter && sub_entity_field.sub_entity_config
        ? build_sub_entity_handlers(
            sub_entity_field.sub_entity_config.child_entity_type,
            sub_filter,
          )
        : null}
    <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4">
        {sub_entity_field.display_name}
      </h3>
      {#if sub_filter && sub_entity_field.sub_entity_config}
        <DynamicEntityList
          entity_type={sub_entity_field.sub_entity_config.child_entity_type}
          sub_entity_filter={sub_filter}
          crud_handlers={sub_entity_handlers}
          show_actions={true}
        />
      {/if}
    </div>
  {:else}
    <div
      class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <p class="text-sm text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> After saving this record, you'll be able to
        manage {sub_entity_field.display_name.toLowerCase()}.
      </p>
    </div>
  {/if}
{/each}
