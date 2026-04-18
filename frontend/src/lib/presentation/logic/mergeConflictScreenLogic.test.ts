import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_merge_conflict_resolved_data,
  format_merge_conflict_timestamp,
  format_merge_conflict_value,
  get_merge_conflict_selected_value_source,
} from "./mergeConflictScreenLogic";

describe("mergeConflictScreenLogic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
  });

  it("builds resolved merge payloads with updated timestamps", () => {
    expect(
      build_merge_conflict_resolved_data(
        { local_data: { id: "fixture_1", score: 1 } } as never,
        { score: 2 },
      ),
    ).toEqual({
      id: "fixture_1",
      score: 2,
      updated_at: "2026-04-08T12:00:00.000Z",
    });
  });

  it("formats merge values and timestamps safely", () => {
    const parsed_null_value = JSON.parse("null") as unknown;
    const missing_value = ({} as Record<string, unknown>).missing_value;

    expect(format_merge_conflict_value(parsed_null_value)).toBe("null");
    expect(format_merge_conflict_value(missing_value)).toBe("undefined");
    expect(format_merge_conflict_value({ score: 3 })).toContain('"score": 3');
    expect(format_merge_conflict_timestamp("")).toBe("Unknown");
    expect(
      format_merge_conflict_timestamp("2026-04-08T12:00:00.000Z"),
    ).not.toBe("Unknown");
  });

  it("tracks whether a custom value came from the local or remote side", () => {
    const difference = {
      local_value: "local_score",
      remote_value: "remote_score",
    } as never;

    expect(
      get_merge_conflict_selected_value_source(
        { score: "local_score" },
        "score",
        difference,
      ),
    ).toBe("local");
    expect(
      get_merge_conflict_selected_value_source(
        { score: "remote_score" },
        "score",
        difference,
      ),
    ).toBe("remote");
    expect(
      get_merge_conflict_selected_value_source(
        { other: "value" },
        "score",
        difference,
      ),
    ).toBe("none");
  });
});
