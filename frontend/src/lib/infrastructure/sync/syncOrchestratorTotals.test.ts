import { describe, expect, it, vi } from "vitest";

import {
  build_sync_result,
  create_empty_totals,
} from "./syncOrchestratorTotals";

const TABLE_CONFLICT = {
  table_name: "teams",
  conflicts: [],
};

describe("build_sync_result", () => {
  it("treats a run that only found conflicts as completed with items to review", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const result = build_sync_result(
      { ...create_empty_totals(), all_conflicts: [TABLE_CONFLICT] },
      Date.now(),
      1,
    );

    expect(result.success).toBe(true);
    expect(result.conflicts).toEqual([TABLE_CONFLICT]);
  });

  it("fails a run that hit table errors", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = build_sync_result(
      {
        ...create_empty_totals(),
        errors: [{ table_name: "teams", error: "offline" }],
      },
      Date.now(),
      1,
    );

    expect(result.success).toBe(false);
  });
});
