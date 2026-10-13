import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  enqueue_all_local_records_for_push,
  start_background_sync,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { clear_all_demo_data_in_convex } from "$lib/infrastructure/sync/convexSyncService";

import { reset_all_local_repositories } from "./dataResetRepositoryResets";
import { rebuild_signed_out_demo_data } from "./dataResetService";
import {
  clear_all_settings_mock,
  prepare_reset_test,
  reset_test_state,
} from "./dataResetService.test_support";
import { seed_all_data_if_needed } from "./seedingService";

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

describe("rebuild_signed_out_demo_data", () => {
  beforeEach(() => {
    prepare_reset_test();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("seeds fresh demo data locally without touching the server, even if Clerk still reports a session", async () => {
    reset_test_state.is_signed_in = true;
    reset_test_state.app_settings["sports_org_session_synced"] = "stale";

    const result = await rebuild_signed_out_demo_data();

    expect(result).toEqual({ success: true, data: true });
    expect(clear_all_settings_mock).toHaveBeenCalledTimes(1);
    expect(reset_all_local_repositories).toHaveBeenCalledTimes(1);
    expect(seed_all_data_if_needed).toHaveBeenCalledTimes(1);
    expect(clear_all_demo_data_in_convex).not.toHaveBeenCalled();
    expect(start_background_sync).not.toHaveBeenCalled();
    expect(enqueue_all_local_records_for_push).not.toHaveBeenCalled();
    expect(reset_test_state.app_settings).toEqual({});
  });

  it("reports a failure when the demo data could not be seeded", async () => {
    vi.mocked(seed_all_data_if_needed).mockResolvedValueOnce({
      success: false,
      error: "seed failed",
    });

    const result = await rebuild_signed_out_demo_data();

    expect(result.success).toBe(false);
  });
});
