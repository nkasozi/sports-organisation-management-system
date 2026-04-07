<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
  import type { UserRole } from "$lib/core/interfaces/ports";
  import { build_dynamic_form_enum_select_options } from "$lib/presentation/logic/dynamicEntityFormFieldState";
  import type { DynamicFormFieldCallbacks } from "$lib/presentation/logic/dynamicFormComponentTypes";
  import { build_foreign_key_select_options } from "$lib/presentation/logic/dynamicFormLogic";

  import DynamicFormComplexField from "./DynamicFormComplexField.svelte";
  import DynamicFormEnumField from "./DynamicFormEnumField.svelte";
  import DynamicFormFileField from "./DynamicFormFileField.svelte";
  import DynamicFormForeignKeyField from "./DynamicFormForeignKeyField.svelte";
  import DynamicFormScalarField from "./DynamicFormScalarField.svelte";
  import DynamicFormStringField from "./DynamicFormStringField.svelte";

  export let field: FieldMetadata;
  export let entity_type: string;
  export let form_data: Record<string, any> = {};
  export let field_value: unknown;
  export let validation_error: string = "";
  export let validation_errors: Record<string, string> = {};
  export let is_required: boolean = false;
  export let is_read_only: boolean = false;
  export let foreign_key_options: Record<string, any[]> = {};
  export let is_loading: boolean = false;
  export let is_filtered_loading: boolean = false;
  export let current_auth_role: UserRole | null = null;
  export let callbacks: DynamicFormFieldCallbacks;

  $: is_full_width =
    field.field_type === "file" ||
    field.field_type === "stage_template_array" ||
    (field.field_type === "string" &&
      (field.field_name.includes("description") ||
        field.field_name.includes("address") ||
        field.field_name.includes("notes")));
  $: enum_options = build_dynamic_form_enum_select_options(
    field,
    form_data,
    entity_type,
    current_auth_role,
  );
</script>

<div class={`space-y-2 ${is_full_width ? "md:col-span-2" : ""}`}>
  <label class="label" for={`field_${field.field_name}`}>
    {field.display_name}
    {#if is_required}
      <span class="text-red-500 dark:text-red-400">*</span>
    {/if}
  </label>

  {#if field.field_type === "file"}
    <DynamicFormFileField
      {field}
      value={typeof field_value === "string" ? field_value : ""}
      {is_read_only}
      handle_file_change={callbacks.handle_file_change}
    />
  {:else if field.field_type === "string"}
    <DynamicFormStringField
      {field}
      value={field_value}
      {is_read_only}
      set_scalar_value={callbacks.set_scalar_value}
    />
  {:else if ["star_rating", "number", "boolean", "date"].includes(field.field_type)}
    <DynamicFormScalarField
      {field}
      value={field_value}
      {is_read_only}
      set_scalar_value={callbacks.set_scalar_value}
    />
  {:else if field.field_type === "enum"}
    <DynamicFormEnumField
      {field}
      value={typeof field_value === "string" ? field_value : ""}
      options={enum_options}
      {is_required}
      {is_read_only}
      {validation_error}
      dependency_value={field.enum_dependency
        ? (form_data[field.enum_dependency.depends_on_field] ?? "")
        : ""}
      set_managed_value={callbacks.set_managed_value}
    />
  {:else if field.field_type === "foreign_key"}
    <DynamicFormForeignKeyField
      {field}
      value={typeof field_value === "string" ? field_value : ""}
      options={build_foreign_key_select_options(field, foreign_key_options)}
      {is_required}
      {is_read_only}
      {validation_error}
      {is_loading}
      {is_filtered_loading}
      dependency_value={field.foreign_key_filter
        ? (form_data[field.foreign_key_filter.depends_on_field] ?? "")
        : ""}
      option_count={(foreign_key_options[field.field_name] || []).length}
      navigate_to_foreign_entity={callbacks.navigate_to_foreign_entity}
      handle_foreign_key_change={callbacks.handle_foreign_key_change}
    />
  {:else}
    <DynamicFormComplexField
      {field}
      value={field_value}
      {form_data}
      {is_read_only}
      {validation_error}
      {validation_errors}
      {callbacks}
    />
  {/if}

  {#if validation_error && field.field_type !== "enum" && field.field_type !== "foreign_key"}
    <p class="mt-1 text-sm text-red-600 dark:text-red-300">
      {validation_error}
    </p>
  {/if}
</div>
