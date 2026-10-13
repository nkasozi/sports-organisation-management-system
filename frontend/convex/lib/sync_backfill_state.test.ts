import { describe, expect, it } from "vitest";

import {
  BackfillSliceStatus,
  BackfillStatus,
  NOT_STARTED_BACKFILL_STATE,
  resolve_backfill_slice_status,
  transition_backfill_state,
} from "./sync_backfill_state";

const NOW_ISO = "2024-05-01T00:00:00.000Z";

describe("transition_backfill_state", () => {
  it("completes a table whose scan drained every unsequenced row", () => {
    expect(
      transition_backfill_state(
        NOT_STARTED_BACKFILL_STATE,
        { backfilled_count: 3, drained: true },
        NOW_ISO,
      ),
    ).toEqual({
      status: BackfillStatus.COMPLETE,
      backfilled_count: 3,
      updated_at: NOW_ISO,
    });
  });

  it("keeps a table running while unsequenced rows remain", () => {
    expect(
      transition_backfill_state(
        NOT_STARTED_BACKFILL_STATE,
        { backfilled_count: 200, drained: false },
        NOW_ISO,
      ).status,
    ).toBe(BackfillStatus.RUNNING);
  });

  it("reopens a completed table when new unsequenced rows appear", () => {
    const completed = transition_backfill_state(
      NOT_STARTED_BACKFILL_STATE,
      { backfilled_count: 0, drained: true },
      NOW_ISO,
    );
    expect(
      transition_backfill_state(
        completed,
        { backfilled_count: 200, drained: false },
        NOW_ISO,
      ),
    ).toEqual({
      status: BackfillStatus.RUNNING,
      backfilled_count: 200,
      updated_at: NOW_ISO,
    });
  });
});

describe("resolve_backfill_slice_status", () => {
  it.each([
    [true, 0, BackfillSliceStatus.COMPLETE],
    [false, 0, BackfillSliceStatus.CONTINUED],
    [false, 100_000, BackfillSliceStatus.CONTINUATION_LIMIT_REACHED],
  ])(
    "maps all_complete=%s at continuation %s to %s",
    (all_complete, continuation_count, expected_status) => {
      expect(
        resolve_backfill_slice_status({ all_complete, continuation_count }),
      ).toBe(expected_status);
    },
  );
});
