<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type {
    ConflictRecord,
    ConflictResolutionAction,
    FieldDifference,
  } from "$lib/infrastructure/sync/conflictTypes";
  import MergeConflictDifferences from "$lib/presentation/components/mergeConflict/MergeConflictDifferences.svelte";
  import MergeConflictFooter from "$lib/presentation/components/mergeConflict/MergeConflictFooter.svelte";
  import MergeConflictHeader from "$lib/presentation/components/mergeConflict/MergeConflictHeader.svelte";
  import MergeConflictResolutionOptions from "$lib/presentation/components/mergeConflict/MergeConflictResolutionOptions.svelte";
  import MergeConflictSummary from "$lib/presentation/components/mergeConflict/MergeConflictSummary.svelte";
  import {
    build_merge_conflict_resolved_data,
    format_merge_conflict_timestamp,
    format_merge_conflict_value,
    get_merge_conflict_selected_value_source,
  } from "$lib/presentation/logic/mergeConflictScreenLogic";
  import { conflict_store } from "$lib/presentation/stores/conflictStore";
  import {
    conflict_progress,
    current_conflict,
    pending_conflicts,
    show_merge_screen,
  } from "$lib/presentation/stores/conflictStoreDerived";

  const dispatch = createEventDispatcher<{
    dismiss: void;
    resolve: {
      action: ConflictResolutionAction;
      conflict: ConflictRecord;
      merged_data?: Record<string, unknown>;
    };
  }>();

  let custom_merge_values: Record<string, unknown> = {};
  let selected_action: ConflictResolutionAction = "keep_local";

  function handle_resolve_current(): void {
    const conflict = $current_conflict;
    if (!conflict) return;
    const resolved_data =
      selected_action === "merge"
        ? build_merge_conflict_resolved_data(conflict, custom_merge_values)
        : undefined;
    dispatch("resolve", {
      action: selected_action,
      conflict,
      merged_data: resolved_data,
    });
    conflict_store.resolve_current_conflict(selected_action, resolved_data);
    if (!conflict_store.move_to_next_conflict()) dispatch("dismiss");
    selected_action = "keep_local";
    custom_merge_values = {};
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
</script>

{#if $show_merge_screen && $current_conflict}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
  >
    <div
      class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
    >
      <MergeConflictHeader
        current_progress={$conflict_progress.current}
        resolved_progress={$conflict_progress.resolved}
        total_progress={$conflict_progress.total}
        on_dismiss={handle_dismiss}
      />
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <MergeConflictSummary
          conflict={$current_conflict}
          format_timestamp={format_merge_conflict_timestamp}
        />
        <MergeConflictDifferences
          differences={$current_conflict.field_differences}
          format_value={format_merge_conflict_value}
          get_selected_value_source={(field_name, difference) =>
            get_merge_conflict_selected_value_source(
              custom_merge_values,
              field_name,
              difference,
            )}
          on_select_field_value={handle_select_field_value}
        />
        <MergeConflictResolutionOptions bind:selected_action />
      </div>
      <MergeConflictFooter
        on_dismiss={handle_dismiss}
        on_keep_all_local={handle_resolve_all_keep_local}
        on_keep_all_remote={handle_resolve_all_keep_remote}
        on_resolve_current={handle_resolve_current}
      />
    </div>
  </div>
{/if}
