import { beforeEach, describe, expect, it, vi } from "vitest";

import { get_resolved_data_for_action } from "./conflictStoreHelpers";

describe("conflictStoreHelpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
  });

  it("returns the correct resolved payload for each conflict action", () => {
    const conflict = {
      local_data: { id: "fixture_1", score: 1 },
      remote_data: { id: "fixture_1", score: 2 },
    } as never;

    expect(get_resolved_data_for_action(conflict, "keep_remote")).toEqual({
      id: "fixture_1",
      score: 2,
    });
    expect(
      get_resolved_data_for_action(conflict, "merge", { score: 3 }),
    ).toEqual({ score: 3 });
    expect(get_resolved_data_for_action(conflict, "merge")).toEqual({
      id: "fixture_1",
      score: 1,
    });

    expect(get_resolved_data_for_action(conflict, "keep_local")).toEqual({
      id: "fixture_1",
      score: 1,
      updated_at: "2026-04-08T12:00:00.000Z",
    });
  });
});
