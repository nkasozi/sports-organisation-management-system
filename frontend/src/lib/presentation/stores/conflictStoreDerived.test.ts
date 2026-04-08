import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConflictRecord } from "$lib/infrastructure/sync/conflictTypes";

import type { ConflictStoreState } from "./conflictStoreHelpers";

const conflict_store_mock = vi.hoisted(() => {
  let current_value: ConflictStoreState = {
    pending_conflicts: [],
    resolved_conflicts: [],
    is_resolution_in_progress: false,
    current_conflict_index: 0,
    show_merge_screen: false,
  };
  const subscribers = new Set<(value: ConflictStoreState) => void>();

  return {
    set_state: (next_value: ConflictStoreState): void => {
      current_value = next_value;
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
    conflict_store: {
      subscribe(subscriber: (value: ConflictStoreState) => void): () => void {
        subscriber(current_value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
    },
  };
});

vi.mock("./conflictStore", () => ({
  conflict_store: conflict_store_mock.conflict_store,
}));

import {
  conflict_progress,
  current_conflict,
  has_pending_conflicts,
  pending_conflict_count,
  pending_conflicts,
  show_merge_screen,
} from "./conflictStoreDerived";

function build_conflict_record(conflict_id: string): ConflictRecord {
  return {
    id: conflict_id,
    table_name: "teams",
    local_id: conflict_id,
    entity_display_name: `Team ${conflict_id}`,
    local_data: {},
    remote_data: {},
    local_updated_at: "2024-01-01T00:00:00.000Z",
    remote_updated_at: "2024-01-02T00:00:00.000Z",
    remote_updated_by: null,
    remote_updated_by_name: null,
    field_differences: [],
    detected_at: "2024-01-03T00:00:00.000Z",
  };
}

describe("conflictStoreDerived", () => {
  beforeEach(() => {
    conflict_store_mock.set_state({
      pending_conflicts: [],
      resolved_conflicts: [],
      is_resolution_in_progress: false,
      current_conflict_index: 0,
      show_merge_screen: false,
    });
  });

  it("projects the current pending conflict state and merge progress", () => {
    const first_conflict = build_conflict_record("conflict-1");
    const second_conflict = build_conflict_record("conflict-2");

    conflict_store_mock.set_state({
      pending_conflicts: [first_conflict, second_conflict],
      resolved_conflicts: [
        {
          conflict_id: "resolved-1",
          table_name: "teams",
          local_id: "resolved-1",
          action: "keep_local",
          resolved_at: "2024-01-04T00:00:00.000Z",
          resolved_by: null,
        },
      ],
      is_resolution_in_progress: false,
      current_conflict_index: 1,
      show_merge_screen: true,
    });

    expect(get(pending_conflicts)).toEqual([first_conflict, second_conflict]);
    expect(get(has_pending_conflicts)).toBe(true);
    expect(get(pending_conflict_count)).toBe(2);
    expect(get(show_merge_screen)).toBe(true);
    expect(get(current_conflict)).toEqual(second_conflict);
    expect(get(conflict_progress)).toEqual({
      current: 2,
      total: 3,
      resolved: 1,
    });
  });

  it("returns null when the current conflict index is out of range", () => {
    conflict_store_mock.set_state({
      pending_conflicts: [build_conflict_record("conflict-1")],
      resolved_conflicts: [],
      is_resolution_in_progress: false,
      current_conflict_index: 4,
      show_merge_screen: true,
    });

    expect(get(current_conflict)).toBeNull();
  });
});
