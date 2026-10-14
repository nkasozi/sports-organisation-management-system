import { beforeEach, describe, expect, it, vi } from "vitest";

import { enqueue_all_local_records_for_push } from "$lib/infrastructure/sync/backgroundSyncService";
import { clear_all_demo_data_in_convex } from "$lib/infrastructure/sync/convexSyncService";
import { resume_in_flight_sync_work } from "$lib/infrastructure/sync/syncSessionQuiesce";
import { sync_store } from "$lib/presentation/stores/syncStore";

import { reset_all_data } from "./dataResetService";
import {
  prepare_reset_test,
  reset_test_state,
} from "./dataResetService.test_support";

vi.mock("./dataResetRepositoryResets", () => ({
  reset_all_local_repositories: vi.fn().mockResolvedValue(true),
}));
vi.mock("./seedingService", () => ({
  seed_all_data_if_needed: vi.fn().mockResolvedValue({
    success: true,
    data: true,
  }),
}));
vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  clear_all_demo_data_in_convex: vi.fn().mockResolvedValue(true),
}));
vi.mock("$lib/infrastructure/sync/backgroundSyncService", async () =>
  (
    await import("./dataResetService.test_support")
  ).create_background_sync_mock(),
);
vi.mock("$lib/infrastructure/sync/syncSessionQuiesce", async () =>
  (
    await import("./dataResetService.test_support")
  ).create_session_quiesce_mock(),
);
vi.mock("$lib/presentation/stores/syncStore", () => ({
  sync_store: { sync_now: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("$lib/presentation/stores/initialSyncStore", () => ({
  clear_session_sync_flag: vi.fn(),
}));
vi.mock("$lib/adapters/iam/clerkAuthService", async () =>
  (await import("./dataResetService.test_support")).create_signed_in_mock(),
);
vi.mock("$lib/infrastructure/container", async () =>
  (await import("./dataResetService.test_support")).create_container_mock(),
);

const ignore_progress = (): boolean => true;

describe("reset_all_data after a server clear", () => {
  beforeEach(() => prepare_reset_test());

  it("enqueues reseeded records with a recreate base so ids tombstoned by the server clear are recreated", async () => {
    reset_test_state.is_signed_in = true;

    await reset_all_data(ignore_progress);

    expect(enqueue_all_local_records_for_push).toHaveBeenCalledWith({
      kind: "recreate",
    });
  });

  it("resumes in-flight sync work before pushing the reseeded data", async () => {
    reset_test_state.is_signed_in = true;
    const call_order: string[] = [];
    vi.mocked(resume_in_flight_sync_work).mockImplementationOnce(() => {
      call_order.push("resume");
      return true;
    });
    vi.mocked(sync_store.sync_now).mockImplementationOnce(async () => {
      call_order.push("push");
      return { success: true } as never;
    });

    await reset_all_data(ignore_progress);

    expect(call_order).toEqual(["resume", "push"]);
  });

  it("resumes in-flight sync work even when the server clear fails", async () => {
    reset_test_state.is_signed_in = true;
    vi.mocked(clear_all_demo_data_in_convex).mockResolvedValueOnce(false);

    await reset_all_data(ignore_progress);

    expect(resume_in_flight_sync_work).toHaveBeenCalledOnce();
  });
});
