<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
  import {
    build_foreign_entity_cta_label,
    build_foreign_entity_route,
  } from "$lib/presentation/logic/dynamicFormLogic";

  import SearchableSelectField from "../ui/SearchableSelectField.svelte";

  export let field: FieldMetadata;
  export let value: string = "";
  export let options: {
    value: string;
    label: string;
    color_swatch?: string;
  }[] = [];
  export let is_required: boolean = false;
  export let is_read_only: boolean = false;
  export let validation_error: string = "";
  export let is_loading: boolean = false;
  export let is_filtered_loading: boolean = false;
  export let dependency_value: string = "";
  export let option_count: number = 0;
  export let navigate_to_foreign_entity: (
    entity_type: string | undefined,
  ) => boolean;
  export let handle_foreign_key_change: (
    field_name: string,
    value: string,
  ) => Promise<void>;

  $: placeholder =
    field.foreign_key_filter && !dependency_value
      ? `First select ${field.foreign_key_filter.depends_on_field.replace("_id", "")}`
      : `Select ${field.display_name}`;
  $: has_create_route = !!build_foreign_entity_route(field.foreign_key_entity);
  $: show_empty_state =
    !is_loading && option_count === 0 && !field.foreign_key_filter;
  $: show_filtered_empty_state =
    !is_loading &&
    !is_filtered_loading &&
    option_count === 0 &&
    !!field.foreign_key_filter &&
    !!dependency_value;
</script>

<SearchableSelectField
  label=""
  name={field.field_name}
  {value}
  {options}
  {placeholder}
  required={is_required}
  disabled={is_read_only || (field.foreign_key_filter && !dependency_value)}
  error={validation_error}
  {is_loading}
  on:change={(event) =>
    handle_foreign_key_change(field.field_name, event.detail.value)}
/>

{#if show_empty_state}
  <div
    class="mt-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100"
  >
    <div class="text-sm font-semibold">
      No {field.display_name} options available.
    </div>
    <div class="text-sm mt-1">
      Create at least one {field.foreign_key_entity || "record"} to continue.
    </div>
    {#if field.foreign_key_entity && has_create_route}
      <div class="mt-2">
        <button
          type="button"
          class="btn btn-outline"
          on:click={() => navigate_to_foreign_entity(field.foreign_key_entity)}
        >
          {build_foreign_entity_cta_label(field.foreign_key_entity)}
        </button>
      </div>
    {/if}
  </div>
{:else if show_filtered_empty_state}
  <div
    class="mt-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
  >
    <div class="text-sm">
      No recently completed {field.display_name.toLowerCase()} found.
    </div>
  </div>
{/if}
