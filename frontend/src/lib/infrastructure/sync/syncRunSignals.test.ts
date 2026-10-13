import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  create_sync_backfill_deferrals,
  create_sync_run_cancellation,
} from "./syncRunSignals";

describe("sync run signals", () => {
  it("cancels only runs that started before the cancellation", () => {
    const cancellation = create_sync_run_cancellation();
    const old_run = cancellation.current_epoch();
    cancellation.cancel_active_runs();
    const new_run = cancellation.current_epoch();

    expect(cancellation.is_cancelled(old_run)).toBe(true);
    expect(cancellation.is_cancelled(new_run)).toBe(false);
  });

  it("hands out the longest backfill retry once", () => {
    const deferrals = create_sync_backfill_deferrals();
    deferrals.record("teams", 1_000);
    deferrals.record("players", 30_000);

    expect(deferrals.take_longest_retry_after()).toEqual(
      create_some_option(30_000),
    );
    expect(deferrals.take_longest_retry_after()).toEqual(create_none_option());
  });
});
