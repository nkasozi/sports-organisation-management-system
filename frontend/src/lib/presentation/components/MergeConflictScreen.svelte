<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    conflict_store,
    pending_conflicts,
    current_conflict,
    conflict_progress,
    show_merge_screen,
  } from "$lib/presentation/stores/conflictStore";
  import type {
    ConflictRecord,
    ConflictResolutionAction,
    FieldDifference,
  } from "$lib/infrastructure/sync/conflictTypes";

  const dispatch = createEventDispatcher<{
    resolve: {
      conflict: ConflictRecord;
      action: ConflictResolutionAction;
      merged_data?: Record<string, unknown>;
    };
    dismiss: void;
  }>();

  let selected_action: ConflictResolutionAction = "keep_local";
  let custom_merge_values: Record<string, unknown> = {};

  function handle_resolve_current(): void {
    const conflict = $current_conflict;
    if (!conflict) return;

    let resolved_data: Record<string, unknown> | undefined;

    if (selected_action === "merge") {
      resolved_data = build_merged_data(conflict);
    }

    dispatch("resolve", {
      conflict,
      action: selected_action,
      merged_data: resolved_data,
    });

    conflict_store.resolve_current_conflict(selected_action, resolved_data);
    const has_more = conflict_store.move_to_next_conflict();

    if (!has_more) {
      dispatch("dismiss");
    }

    selected_action = "keep_local";
    custom_merge_values = {};
  }

  function build_merged_data(
    conflict: ConflictRecord,
  ): Record<string, unknown> {
    const base = { ...conflict.local_data };

    for (const [field, value] of Object.entries(custom_merge_values)) {
      base[field] = value;
    }

    base.updated_at = new Date().toISOString();
    return base;
  }

  function handle_select_field_value(
    field_name: string,
    source: "local" | "remote",
    difference: FieldDifference,
  ): void {
    custom_merge_values[field_name] =
      source === "local" ? difference.local_value : difference.remote_value;
  }

  function handle_dismiss(): void {
    conflict_store.dismiss_merge_screen();
    dispatch("dismiss");
  }

  function handle_resolve_all_keep_local(): void {
    for (const conflict of $pending_conflicts) {
      conflict_store.resolve_conflict(conflict.id, "keep_local");
    }
    dispatch("dismiss");
  }

  function handle_resolve_all_keep_remote(): void {
    for (const conflict of $pending_conflicts) {
      conflict_store.resolve_conflict(conflict.id, "keep_remote");
    }
    dispatch("dismiss");
  }

  function format_value(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  }

  function format_timestamp(timestamp: string): string {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function get_selected_value_source(
    field_name: string,
    difference: FieldDifference,
  ): "local" | "remote" | "none" {
    if (!(field_name in custom_merge_values)) return "none";
    const selected = custom_merge_values[field_name];
    if (selected === difference.local_value) return "local";
    if (selected === difference.remote_value) return "remote";
    return "none";
  }
</script>

{#if $show_merge_screen && $current_conflict}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
  >
    <div
      class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
    >
      <div class="border-b border-gray-200 bg-amber-50 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              Sync Conflict Detected
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              {$conflict_progress.current} of {$conflict_progress.total} conflicts
              ({$conflict_progress.resolved} resolved)
            </p>
          </div>
          <button
            on:click={handle_dismiss}
            class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 class="mb-2 font-medium text-gray-900">
            {$current_conflict.entity_display_name}
          </h3>
          <p class="text-sm text-gray-600">
            Table: <span class="font-medium"
              >{$current_conflict.table_name}</span
            >
          </p>
          <p class="text-sm text-gray-600">
            Detected: {format_timestamp($current_conflict.detected_at)}
          </p>
        </div>

        <div class="mb-6 grid grid-cols-2 gap-4">
          <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <div class="mb-2 flex items-center gap-2">
              <div class="h-3 w-3 rounded-full bg-blue-500"></div>
              <h4 class="font-medium text-blue-900">Your Changes (Local)</h4>
            </div>
            <p class="text-sm text-blue-700">
              Updated: {format_timestamp($current_conflict.local_updated_at)}
            </p>
          </div>

          <div class="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <div class="mb-2 flex items-center gap-2">
              <div class="h-3 w-3 rounded-full bg-green-500"></div>
              <h4 class="font-medium text-green-900">
                Server Version (Remote)
              </h4>
            </div>
            <p class="text-sm text-green-700">
              Updated: {format_timestamp($current_conflict.remote_updated_at)}
            </p>
            {#if $current_conflict.remote_updated_by_name}
              <p class="text-sm text-green-700">
                By: {$current_conflict.remote_updated_by_name}
              </p>
            {/if}
          </div>
        </div>

        <div class="mb-6">
          <h4 class="mb-3 font-medium text-gray-900">Field Differences</h4>
          <div class="space-y-3">
            {#each $current_conflict.field_differences as difference}
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
                      handle_select_field_value(
                        difference.field_name,
                        "local",
                        difference,
                      )}
                    on:keydown={(e) =>
                      e.key === "Enter" &&
                      handle_select_field_value(
                        difference.field_name,
                        "local",
                        difference,
                      )}
                    role="button"
                    tabindex="0"
                  >
                    <div class="mb-1 text-xs font-medium text-blue-600">
                      Local
                    </div>
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
                      handle_select_field_value(
                        difference.field_name,
                        "remote",
                        difference,
                      )}
                    on:keydown={(e) =>
                      e.key === "Enter" &&
                      handle_select_field_value(
                        difference.field_name,
                        "remote",
                        difference,
                      )}
                    role="button"
                    tabindex="0"
                  >
                    <div class="mb-1 text-xs font-medium text-green-600">
                      Remote
                    </div>
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

        <div class="mb-6">
          <h4 class="mb-3 font-medium text-gray-900">Resolution Strategy</h4>
          <div class="space-y-2">
            <label
              class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
              'keep_local'
                ? 'border-blue-500 bg-blue-50'
                : ''}"
            >
              <input
                type="radio"
                name="resolution"
                value="keep_local"
                bind:group={selected_action}
                class="h-4 w-4 text-blue-600"
              />
              <div>
                <div class="font-medium text-gray-900">Keep My Changes</div>
                <div class="text-sm text-gray-600">
                  Overwrite the server version with your local changes
                </div>
              </div>
            </label>

            <label
              class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
              'keep_remote'
                ? 'border-green-500 bg-green-50'
                : ''}"
            >
              <input
                type="radio"
                name="resolution"
                value="keep_remote"
                bind:group={selected_action}
                class="h-4 w-4 text-green-600"
              />
              <div>
                <div class="font-medium text-gray-900">Keep Server Version</div>
                <div class="text-sm text-gray-600">
                  Discard your changes and use the server version
                </div>
              </div>
            </label>

            <label
              class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
              'merge'
                ? 'border-purple-500 bg-purple-50'
                : ''}"
            >
              <input
                type="radio"
                name="resolution"
                value="merge"
                bind:group={selected_action}
                class="h-4 w-4 text-purple-600"
              />
              <div>
                <div class="font-medium text-gray-900">Manual Merge</div>
                <div class="text-sm text-gray-600">
                  Select individual field values from above
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4"
      >
        <div class="flex gap-2">
          <button
            on:click={handle_resolve_all_keep_local}
            class="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Keep All Local
          </button>
          <button
            on:click={handle_resolve_all_keep_remote}
            class="rounded-md border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            Keep All Remote
          </button>
        </div>

        <div class="flex gap-3">
          <button
            on:click={handle_dismiss}
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Resolve Later
          </button>
          <button
            on:click={handle_resolve_current}
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Resolution
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
