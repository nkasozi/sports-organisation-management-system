<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  import SearchableSelectField from "../ui/SearchableSelectField.svelte";

  export let field: FieldMetadata;
  export let value: string = "";
  export let options: { value: string; label: string }[] = [];
  export let is_required: boolean = false;
  export let is_read_only: boolean = false;
  export let validation_error: string = "";
  export let dependency_value: string = "";
  export let set_managed_value: (field_name: string, value: unknown) => boolean;

  $: placeholder =
    field.enum_dependency && !dependency_value
      ? `First select ${field.enum_dependency.depends_on_field.replace("_", " ")}`
      : `Select ${field.display_name}`;
</script>

<SearchableSelectField
  label=""
  name={field.field_name}
  {value}
  {options}
  {placeholder}
  required={is_required}
  disabled={is_read_only || (field.enum_dependency && !dependency_value)}
  error={validation_error}
  on:change={(event) => set_managed_value(field.field_name, event.detail.value)}
/>
