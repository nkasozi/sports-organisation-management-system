<script lang="ts">
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import DynamicEntityForm from "$lib/presentation/components/DynamicEntityForm.svelte";

  export let crud_handlers: EntityCrudHandlers | undefined;
  export let display_name: string;
  export let entity_type: string;
  export let inline_form_entity: Partial<BaseEntity>;
  export let is_mobile_view: boolean;
  export let sub_entity_filter: SubEntityFilter | undefined;
  export let on_inline_cancel: () => boolean;
  export let on_inline_save_success: (
    event: CustomEvent<{ entity: BaseEntity }>,
  ) => Promise<boolean>;
</script>

<div
  class="rounded-lg border-2 border-primary-300 bg-gray-50 p-4 dark:border-primary-600 dark:bg-gray-800"
>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
      {inline_form_entity.id ? "Edit" : "Add New"}
      {display_name}
    </h3>
    <button
      type="button"
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      aria-label="Close inline form"
      on:click={on_inline_cancel}
    >
      <svg
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
  <DynamicEntityForm
    {entity_type}
    entity_data={inline_form_entity}
    {is_mobile_view}
    is_inline_mode={true}
    {crud_handlers}
    {sub_entity_filter}
    view_callbacks={void 0}
    on:inline_save_success={on_inline_save_success}
    on:inline_cancel={on_inline_cancel}
  />
</div>
