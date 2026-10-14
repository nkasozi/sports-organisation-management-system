import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { conflict_store } from "./conflictStore";

vi.mock("$lib/infrastructure/sync/conflictAuditService", () => ({
  log_conflict_detected: vi.fn().mockResolvedValue(true),
  log_conflict_resolution: vi.fn().mockResolvedValue(true),
}));

function seed_conflict(): string {
  conflict_store.add_conflicts_from_sync_response("teams", [
    {
      local_id: "team-1",
      local_data: { name: "Mine", city: "Kampala" },
      remote_data: { name: "Theirs", city: "Kampala" },
      remote_data_status: "visible",
      remote_version: 3,
      remote_updated_at: "2024-02-01T00:00:00.000Z",
      remote_updated_by: { status: "unknown" },
    } as never,
  ]);
  return get(conflict_store).pending_conflicts[0].id;
}

describe("conflict_store refresh and removal", () => {
  beforeEach(() => conflict_store.reset());

  it("replaces the remote copy and recomputes differences when the server changed again", () => {
    const conflict_id = seed_conflict();

    conflict_store.refresh_conflict_remote_copy(
      conflict_id,
      {
        name: "Newest",
        city: "Nairobi",
        updated_at: "2024-03-01T00:00:00.000Z",
      },
      7,
    );

    const [conflict] = get(conflict_store).pending_conflicts;
    expect(conflict.remote_version).toBe(7);
    expect(conflict.remote_data).toMatchObject({ name: "Newest" });
    expect(conflict.remote_updated_at).toBe("2024-03-01T00:00:00.000Z");
    expect(
      conflict.field_differences.map((difference) => difference.field_name),
    ).toEqual(expect.arrayContaining(["name", "city"]));
  });

  it("removes a conflict without recording a resolution", () => {
    const conflict_id = seed_conflict();

    expect(conflict_store.remove_conflict(conflict_id)).toBe(true);

    expect(get(conflict_store).pending_conflicts).toEqual([]);
    expect(get(conflict_store).resolved_conflicts).toEqual([]);
  });
});
