import { derived } from "svelte/store";
import { conflict_store } from "./conflictStore";

export const pending_conflicts = derived(
  conflict_store,
  ($store) => $store.pending_conflicts,
);

export const has_pending_conflicts = derived(
  conflict_store,
  ($store) => $store.pending_conflicts.length > 0,
);

export const pending_conflict_count = derived(
  conflict_store,
  ($store) => $store.pending_conflicts.length,
);

export const show_merge_screen = derived(
  conflict_store,
  ($store) => $store.show_merge_screen,
);

export const current_conflict = derived(
  conflict_store,
  ($store) => $store.pending_conflicts[$store.current_conflict_index] || null,
);

export const conflict_progress = derived(conflict_store, ($store) => ({
  current: $store.current_conflict_index + 1,
  total: $store.pending_conflicts.length + $store.resolved_conflicts.length,
  resolved: $store.resolved_conflicts.length,
}));
