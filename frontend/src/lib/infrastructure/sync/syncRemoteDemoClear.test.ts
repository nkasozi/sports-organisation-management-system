import { describe, expect, it, vi } from "vitest";

import {
  CLEAR_JOB_MAX_POLL_ATTEMPTS,
  run_remote_demo_data_clear,
} from "./syncRemoteDemoClear";
import type { ConvexClient } from "./syncTypes";

function create_client(
  mutation_result: unknown,
  status_results: unknown[],
): ConvexClient {
  const query = vi.fn();
  status_results.forEach((status) => query.mockResolvedValueOnce(status));
  return { query, mutation: vi.fn().mockResolvedValue(mutation_result) };
}

const delay = vi.fn(async () => true);

describe("run_remote_demo_data_clear", () => {
  it("returns at once when the server finished the clear in one mutation", async () => {
    const client = create_client(
      {
        success: true,
        deleted_count: 4,
        job_id: "job_1",
        job_status: "completed",
      },
      [],
    );
    expect(
      await run_remote_demo_data_clear({ convex_client: client, delay }),
    ).toEqual({ success: true, data: { deleted_count: 4 } });
    expect(client.query).not.toHaveBeenCalled();
  });

  it("waits for a continued clear job to complete before reporting success", async () => {
    const client = create_client(
      {
        success: true,
        deleted_count: 100,
        job_id: "job_1",
        job_status: "running",
      },
      [
        { status: "running", deleted_count: 150 },
        { status: "completed", deleted_count: 230 },
      ],
    );
    const result = await run_remote_demo_data_clear({
      convex_client: client,
      delay,
    });
    expect(result).toEqual({ success: true, data: { deleted_count: 230 } });
    expect(client.query).toHaveBeenCalledWith("sync:get_clear_job_status", {
      job_id: "job_1",
    });
  });

  it("fails explicitly when the job fails or never finishes", async () => {
    const failing = create_client(
      {
        success: true,
        deleted_count: 0,
        job_id: "job_1",
        job_status: "running",
      },
      [{ status: "failed", deleted_count: 10 }],
    );
    expect(
      (await run_remote_demo_data_clear({ convex_client: failing, delay }))
        .success,
    ).toBe(false);
    const stuck = create_client(
      {
        success: true,
        deleted_count: 0,
        job_id: "job_1",
        job_status: "running",
      },
      Array.from({ length: CLEAR_JOB_MAX_POLL_ATTEMPTS }, () => ({
        status: "running",
        deleted_count: 1,
      })),
    );
    expect(
      await run_remote_demo_data_clear({ convex_client: stuck, delay }),
    ).toEqual({
      success: false,
      error: "Server clear job did not finish in time",
    });
  });

  it("returns the server error when the clear is rejected", async () => {
    const client = create_client(
      { success: false, error: "Access denied", deleted_count: 0 },
      [],
    );
    expect(
      await run_remote_demo_data_clear({ convex_client: client, delay }),
    ).toEqual({ success: false, error: "Access denied" });
  });

  it("turns a transport error into a failure result", async () => {
    const client: ConvexClient = {
      query: vi.fn(),
      mutation: vi.fn().mockRejectedValue(new Error("offline")),
    };
    expect(
      await run_remote_demo_data_clear({ convex_client: client, delay }),
    ).toEqual({ success: false, error: "Error: offline" });
  });
});
