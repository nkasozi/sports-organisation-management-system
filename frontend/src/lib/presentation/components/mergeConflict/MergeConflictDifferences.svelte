<script lang="ts">
  import type { FieldDifference } from "$lib/infrastructure/sync/conflictTypes";

  export let differences: FieldDifference[];
  export let format_value: (value: unknown) => string;
  export let get_selected_value_source: (
    field_name: string,
    difference: FieldDifference,
  ) => "local" | "remote" | "none";
  export let on_select_field_value: (
    field_name: string,
    source: "local" | "remote",
    difference: FieldDifference,
  ) => void;
</script>

<div class="mb-6">
  <h4 class="mb-3 font-medium text-gray-900">Field Differences</h4>
  <div class="space-y-3">
    {#each differences as difference}
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="mb-2 font-medium text-gray-700">
          {difference.display_name}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div
            class="cursor-pointer rounded border-2 p-3 transition-colors {get_selected_value_source(
              difference.field_name,
              difference,
            ) === 'local'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'}"
            on:click={() =>
              on_select_field_value(difference.field_name, "local", difference)}
            on:keydown={(event) =>
              event.key === "Enter" &&
              on_select_field_value(difference.field_name, "local", difference)}
            role="button"
            tabindex="0"
          >
            <div class="mb-1 text-xs font-medium text-blue-600">Local</div>
            <pre
              class="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{format_value(
                difference.local_value,
              )}</pre>
          </div>
          <div
            class="cursor-pointer rounded border-2 p-3 transition-colors {get_selected_value_source(
              difference.field_name,
              difference,
            ) === 'remote'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'}"
            on:click={() =>
              on_select_field_value(
                difference.field_name,
                "remote",
                difference,
              )}
            on:keydown={(event) =>
              event.key === "Enter" &&
              on_select_field_value(
                difference.field_name,
                "remote",
                difference,
              )}
            role="button"
            tabindex="0"
          >
            <div class="mb-1 text-xs font-medium text-green-600">Remote</div>
            <pre
              class="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{format_value(
                difference.remote_value,
              )}</pre>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
