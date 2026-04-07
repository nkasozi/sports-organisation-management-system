<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
  import type { UserRole } from "$lib/core/interfaces/ports";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import type { DynamicFormFieldCallbacks } from "$lib/presentation/logic/dynamicFormComponentTypes";
  import { should_field_be_read_only } from "$lib/presentation/logic/dynamicFormLogic";
  import { should_field_be_required_for_role } from "$lib/presentation/logic/systemUserFormLogic";

  import DynamicFormField from "./DynamicFormField.svelte";

  export let sorted_fields: FieldMetadata[] = [];
  export let entity_type: string;
  export let form_data: Record<string, any> = {};
  export let validation_errors: Record<string, string> = {};
  export let authorization_restricted_fields: Set<string> = new Set();
  export let is_edit_mode: boolean = false;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let foreign_key_options: Record<string, any[]> = {};
  export let filtered_fields_loading: Record<string, boolean> = {};
  export let is_loading: boolean = false;
  export let current_auth_role: UserRole | null = null;
  export let callbacks: DynamicFormFieldCallbacks;

  $: normalized_entity_type = entity_type.toLowerCase().replace(/[\s_-]/g, "");
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {#each sorted_fields as field (field.field_name)}
    {@const is_required =
      field.is_required ||
      (normalized_entity_type === "systemuser" &&
        should_field_be_required_for_role(
          field.field_name,
          form_data["role"] ?? null,
        ))}
    {@const is_read_only = should_field_be_read_only(
      field,
      is_edit_mode,
      authorization_restricted_fields,
      sub_entity_filter,
    )}
    <DynamicFormField
      {field}
      {entity_type}
      {form_data}
      field_value={form_data[field.field_name]}
      validation_error={validation_errors[field.field_name] || ""}
      {validation_errors}
      {is_required}
      {is_read_only}
      {foreign_key_options}
      {is_loading}
      is_filtered_loading={filtered_fields_loading[field.field_name] || false}
      {current_auth_role}
      {callbacks}
    />
  {/each}
</div>
