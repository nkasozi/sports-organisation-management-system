<script lang="ts">
  import type {
    BaseEntity,
    FieldMetadata,
  } from "$lib/core/entities/BaseEntity";
  import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";
  import { build_entity_display_label } from "$lib/presentation/logic/dynamicFormLogic";

  export let available_fields: FieldMetadata[];
  export let filter_values: Record<string, string>;
  export let foreign_key_options: Record<string, BaseEntity[]>;
  export let on_clear_all_filters: () => void;
  export let on_filter_value_change: (
    field_name: string,
    value: string,
  ) => void;
</script>

<div class="rounded-lg border border-accent-200 p-4 dark:border-accent-700">
  <div class="mb-2 flex items-center justify-between">
    <h3 class="font-medium text-accent-900 dark:text-accent-100">
      Advanced Filters
    </h3>
    <button
      type="button"
      class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
      on:click={on_clear_all_filters}>Clear All</button
    >
  </div>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each available_fields as field}
      {#if field.field_type !== "file"}
        <div>
          <label
            class="mb-1 block text-xs font-medium text-accent-700 dark:text-accent-300"
            for="filter_{field.field_name}">{field.display_name}</label
          >
          {#if field.field_type === "foreign_key" && field.foreign_key_entity}
            <SearchableSelectField
              name="filter_{field.field_name}"
              value={filter_values[field.field_name] ?? ""}
              options={[
                { value: "", label: "Any" },
                ...(foreign_key_options[field.field_name] || []).map(
                  (option) => ({
                    value: option.id,
                    label: build_entity_display_label(option),
                  }),
                ),
              ]}
              placeholder="Any"
              on:change={(event) =>
                on_filter_value_change(field.field_name, event.detail.value)}
            />
          {:else if field.field_type === "enum" && field.enum_values}
            <SearchableSelectField
              name="filter_{field.field_name}"
              value={filter_values[field.field_name] ?? ""}
              options={[
                { value: "", label: "Any" },
                ...field.enum_values.map((option) => ({
                  value: option,
                  label: option.charAt(0).toUpperCase() + option.slice(1),
                })),
              ]}
              placeholder="Any"
              on:change={(event) =>
                on_filter_value_change(field.field_name, event.detail.value)}
            />
          {:else if field.field_type === "date"}
            <input
              id="filter_{field.field_name}"
              type="date"
              class="w-full rounded-[0.175rem] border border-accent-300 bg-white px-3 py-2 text-sm text-accent-900 dark:border-accent-600 dark:bg-accent-800 dark:text-accent-100"
              value={filter_values[field.field_name] ?? ""}
              on:input={(event) =>
                on_filter_value_change(
                  field.field_name,
                  (event.currentTarget as HTMLInputElement).value,
                )}
            />
          {:else}
            <input
              id="filter_{field.field_name}"
              type="text"
              class="w-full rounded-[0.175rem] border border-accent-300 bg-white px-3 py-2 text-sm text-accent-900 dark:border-accent-600 dark:bg-accent-800 dark:text-accent-100"
              placeholder={`Filter by ${field.display_name.toLowerCase()}`}
              value={filter_values[field.field_name] ?? ""}
              on:input={(event) =>
                on_filter_value_change(
                  field.field_name,
                  (event.currentTarget as HTMLInputElement).value,
                )}
            />
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>
