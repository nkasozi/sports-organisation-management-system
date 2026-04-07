<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  export let available_fields: FieldMetadata[];
  export let button_color_class: string;
  export let is_visible: boolean;
  export let visible_columns: Set<string>;
  export let on_close: () => void;
  export let on_toggle_column_visibility: (field_name: string) => void;
</script>

{#if is_visible}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click={on_close}
    on:keydown={(event) => event.key === "Escape" && on_close()}
  >
    <div
      class="card max-w-md w-full space-y-4 p-6"
      role="presentation"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
          Manage Columns
        </h3>
        <button
          type="button"
          class="text-accent-500 hover:text-accent-700"
          on:click={on_close}>×</button
        >
      </div>
      <div class="max-h-96 space-y-2 overflow-y-auto">
        {#each available_fields as field}
          <label
            class="flex cursor-pointer items-center rounded p-2 hover:bg-accent-50 dark:hover:bg-accent-700"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
              checked={visible_columns.has(field.field_name)}
              on:change={() => on_toggle_column_visibility(field.field_name)}
            />
            <span class="ml-3 text-sm text-accent-900 dark:text-accent-100"
              >{field.display_name}</span
            >
          </label>
        {/each}
      </div>
      <div
        class="flex justify-end border-t border-accent-200 pt-4 dark:border-accent-700"
      >
        <button
          type="button"
          class="btn {button_color_class}"
          on:click={on_close}>Done</button
        >
      </div>
    </div>
  </div>
{/if}
