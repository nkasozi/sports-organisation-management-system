import { describe, expect, it } from "vitest";

import type { MutationCtx } from "../_generated/server";
import {
  ANONYMOUS_IDENTITY,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
} from "./fake_convex_context.test_support";
import {
  allocate_serialized_table_sync_sequence,
  read_latest_sync_sequence,
} from "./sync_sequence_counter";

function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: ANONYMOUS_IDENTITY,
    tables: {},
  });
}

describe("allocate_serialized_table_sync_sequence", () => {
  it("serializes writers per table through exactly one counter document per table", async () => {
    const context = create_context();
    const ctx = context as unknown as MutationCtx;
    const allocated = [];
    for (const table_name of ["teams", "players", "teams", "teams", "players"])
      allocated.push(
        await allocate_serialized_table_sync_sequence(ctx, table_name),
      );
    expect(allocated).toEqual([1, 1, 2, 3, 2]);
    expect(
      find_table_rows(context, "sync_change_sequences")
        .map((row) => row.table_name)
        .sort(),
    ).toEqual(["players", "teams"]);
  });

  it("hands out gapless, strictly increasing sequences that the change cursor relies on", async () => {
    const context = create_context();
    const ctx = context as unknown as MutationCtx;
    const allocated = [];
    for (let index = 0; index < 5; index++)
      allocated.push(
        await allocate_serialized_table_sync_sequence(ctx, "live_game_logs"),
      );
    expect(allocated).toEqual([1, 2, 3, 4, 5]);
    expect(await read_latest_sync_sequence(ctx, "live_game_logs")).toBe(5);
  });
});
