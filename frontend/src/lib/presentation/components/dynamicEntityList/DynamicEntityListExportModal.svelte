<script lang="ts">
  export let button_color_class: string;
  export let filtered_count: number;
  export let is_visible: boolean;
  export let visible_columns_size: number;
  export let on_close: () => void;
  export let on_export_csv: () => void;
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
          Export Data
        </h3>
        <button
          type="button"
          class="text-accent-500 hover:text-accent-700"
          on:click={on_close}>×</button
        >
      </div>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Export {filtered_count}
        {filtered_count === 1 ? "item" : "items"} with {visible_columns_size} visible
        columns
      </p>
      <div
        class="rounded-lg border border-accent-200 p-4 dark:border-accent-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-accent-900 dark:text-accent-100">
              CSV Format
            </h4>
            <p class="mt-1 text-xs text-accent-600 dark:text-accent-400">
              Comma-separated values, compatible with Excel
            </p>
          </div>
          <button
            type="button"
            class="btn {button_color_class}"
            on:click={on_export_csv}>Export CSV</button
          >
        </div>
      </div>
      <div
        class="flex justify-end border-t border-accent-200 pt-4 dark:border-accent-700"
      >
        <button type="button" class="btn btn-outline" on:click={on_close}
          >Cancel</button
        >
      </div>
    </div>
  </div>
{/if}
