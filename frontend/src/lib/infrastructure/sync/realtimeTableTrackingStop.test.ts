import { describe, expect, it, vi } from "vitest";

import {
  create_convex_realtime_sync,
  DEFAULT_CHANGE_MARKER_QUERY,
} from "./convexRealtimeSync";

type ChangeHandler = (result: unknown) => unknown;

function flush_microtasks(): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("realtime pull loop after stop", () => {
  it("does not start another pull once the watcher has been stopped", async () => {
    const handlers = new Map<string, ChangeHandler>();
    let finish_first_pull = (): boolean => false;
    const pull_table = vi.fn(
      () =>
        new Promise<{ success: boolean; records_pulled: number }>((resolve) => {
          finish_first_pull = (): boolean => {
            resolve({ success: true, records_pulled: 1 });
            return true;
          };
        }),
    );
    const sync = create_convex_realtime_sync({
      subscribable_client: {
        onUpdate: (_query, args, handler) => {
          handlers.set(String(args.table_name), handler as ChangeHandler);
          return { unsubscribe: (): boolean => true };
        },
      },
      pull_table,
      table_names: ["teams"],
      query_reference: DEFAULT_CHANGE_MARKER_QUERY,
      on_table_pulled: () => true,
    });
    sync.start();
    handlers.get("teams")?.({ latest_sequence: 10 });
    handlers.get("teams")?.({ latest_sequence: 20 });

    sync.stop();
    finish_first_pull();
    await flush_microtasks();

    expect(pull_table).toHaveBeenCalledOnce();
  });
});
