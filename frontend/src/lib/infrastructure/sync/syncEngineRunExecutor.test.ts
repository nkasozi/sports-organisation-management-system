import { describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  DependencyStatus,
  execute_sync_run,
  type SyncEngineConfiguration,
} from "./syncEngineRunExecutor";
import { SYNC_ALREADY_IN_PROGRESS_ERROR } from "./syncRunSignals";

function create_configuration(
  sync_now: ReturnType<typeof vi.fn>,
): SyncEngineConfiguration {
  return {
    orchestrator: {
      status: DependencyStatus.CONFIGURED,
      value: { sync_now: sync_now as never, is_configured: () => true },
    },
    restoration_handlers: { status: DependencyStatus.UNCONFIGURED },
    remote_subscriber: { status: DependencyStatus.UNCONFIGURED },
  };
}

function run(
  sync_now: ReturnType<typeof vi.fn>,
  backfill = create_none_option<number>(),
): ReturnType<typeof execute_sync_run> {
  return execute_sync_run({
    run_id: "run_1",
    run_kind: "full",
    configuration: create_configuration(sync_now),
    is_signed_in: true,
    take_backfill_retry_after: () => backfill,
  });
}

describe("execute_sync_run", () => {
  it("defers instead of failing when another sync is already running", async () => {
    const sync_now = vi.fn().mockResolvedValue(
      create_failure_result({
        failed_tables: [],
        message: SYNC_ALREADY_IN_PROGRESS_ERROR,
      }),
    );
    expect(await run(sync_now)).toMatchObject({
      outcome: "deferred",
      reason: "another_sync_running",
    });
  });

  it("waits for the server backfill after an otherwise successful run", async () => {
    const sync_now = vi.fn().mockResolvedValue(create_success_result({}));
    expect(await run(sync_now, create_some_option(30_000))).toEqual({
      outcome: "deferred",
      reason: "server_backfill",
      retry_after_milliseconds: 30_000,
    });
  });

  it("reports ordinary failures as failures", async () => {
    const sync_now = vi
      .fn()
      .mockResolvedValue(
        create_failure_result({ failed_tables: [], message: "boom" }),
      );
    expect(await run(sync_now)).toEqual({ outcome: "failed" });
  });

  it("never pauses realtime subscriptions during a full run", async () => {
    const sync_now = vi.fn().mockResolvedValue(create_success_result({}));
    expect(await run(sync_now)).toEqual({ outcome: "succeeded" });
    expect(sync_now).toHaveBeenCalledWith("bidirectional", {
      use_fresh_timestamps: true,
    });
  });
});
