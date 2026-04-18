<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  import StarRatingInput from "../ui/StarRatingInput.svelte";

  export let field: FieldMetadata;
  export let value: unknown = "";
  export let is_read_only: boolean = false;
  export let set_scalar_value: (field_name: string, value: unknown) => boolean;

  function to_number(input_value: string): number | string {
    return input_value === "" ? "" : Number(input_value);
  }
</script>

{#if field.field_type === "star_rating"}
  <StarRatingInput
    field_id={`field_${field.field_name}`}
    value={typeof value === "number" ? value : 0}
    max={10}
    disabled={is_read_only}
    on:change={(event) => set_scalar_value(field.field_name, event.detail)}
  />
{:else if field.field_type === "number"}
  <input
    id={`field_${field.field_name}`}
    type="number"
    class="input"
    value={value ?? ""}
    placeholder={field.placeholder || field.display_name}
    readonly={is_read_only}
    min={field.field_name.includes("age") ||
    field.field_name.includes("number") ||
    field.field_name.includes("order")
      ? 0
      : void 0}
    max={field.field_name.includes("age") ? 120 : void 0}
    step={field.field_name.includes("price") ||
    field.field_name.includes("amount") ||
    field.field_name.includes("cost")
      ? "0.01"
      : "1"}
    on:input={(event) =>
      set_scalar_value(
        field.field_name,
        to_number((event.currentTarget as HTMLInputElement).value),
      )}
  />
{:else if field.field_type === "boolean"}
  <div class="flex items-center space-x-3">
    <input
      id={`field_${field.field_name}`}
      type="checkbox"
      class="w-5 h-5 text-secondary-600 dark:text-secondary-400 border-gray-300 dark:border-gray-600 rounded focus:ring-secondary-500 dark:focus:ring-secondary-400 cursor-pointer"
      checked={Boolean(value)}
      disabled={is_read_only}
      on:change={(event) =>
        set_scalar_value(
          field.field_name,
          (event.currentTarget as HTMLInputElement).checked,
        )}
    />
    <label
      for={`field_${field.field_name}`}
      class="text-sm text-accent-700 dark:text-accent-300 select-none cursor-pointer"
    >
      {value ? "Yes" : "No"}
    </label>
  </div>
{:else}
  <input
    id={`field_${field.field_name}`}
    type="date"
    class="input"
    value={typeof value === "string" ? value : ""}
    readonly={is_read_only}
    on:input={(event) =>
      set_scalar_value(
        field.field_name,
        (event.currentTarget as HTMLInputElement).value,
      )}
  />
{/if}
