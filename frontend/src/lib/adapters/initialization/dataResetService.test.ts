import { beforeEach, describe, expect, it, vi } from "vitest";

import { set_pulling_from_remote } from "$lib/infrastructure/sync/backgroundSyncService";
import { stop_background_sync_for_maintenance } from "$lib/infrastructure/sync/syncSessionQuiesce";
import { clear_session_sync_flag } from "$lib/presentation/stores/initialSyncStore";

import { reset_all_local_repositories } from "./dataResetRepositoryResets";
import { reset_all_data } from "./dataResetService";
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

describe("reset_all_data flow", () => {
  beforeEach(() => prepare_reset_test());

  it("returns false when window is undefined (SSR guard)", async () => {
    const original_window = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;

    const result = await reset_all_data(ignore_progress);

    expect(result).toBe(false);

    (globalThis as Record<string, unknown>).window = original_window;
  });

  it("returns true on a successful reset", async () => {
    const result = await reset_all_data(ignore_progress);
    expect(result).toBe(true);
  });

  it("waits for in-flight sync work to settle before doing anything else", async () => {
    const call_order = [] as string[];
    vi.mocked(stop_background_sync_for_maintenance).mockImplementation(
      async () => {
        call_order.push("stop");
        return 0;
      },
    );
    vi.mocked(seed_all_data_if_needed).mockImplementation(async () => {
      call_order.push("seed");
      return { success: true as const, data: true };
    });

    await reset_all_data(ignore_progress);

    expect(call_order).toEqual(["stop", "seed"]);
  });

  it("sets pulling_from_remote to true before resetting and false after", async () => {
    const call_order = [] as string[];
    vi.mocked(set_pulling_from_remote).mockImplementation((value: boolean) => {
      call_order.push(value ? "pulling_true" : "pulling_false");
      return true;
    });
    vi.mocked(seed_all_data_if_needed).mockImplementation(async () => {
      call_order.push("seeding");
      return { success: true as const, data: true };
    });

    await reset_all_data(ignore_progress);

    expect(call_order[0]).toBe("pulling_true");
    const pulling_false_index = call_order.lastIndexOf("pulling_false");
    const seeding_index = call_order.indexOf("seeding");
    expect(pulling_false_index).toBeGreaterThan(seeding_index);
  });

  it("clears all app settings via the settings port", async () => {
    await reset_all_data(ignore_progress);
    expect(clear_all_settings_mock).toHaveBeenCalledOnce();
  });

  it("clears the session sync flag so post-reload runs a full initial sync", async () => {
    await reset_all_data(ignore_progress);
    expect(clear_session_sync_flag).toHaveBeenCalledOnce();
  });

  it("clears the session sync flag even when user is not signed in", async () => {
    reset_test_state.is_signed_in = false;
    await reset_all_data(ignore_progress);
    expect(clear_session_sync_flag).toHaveBeenCalledOnce();
  });

  it("re-seeds default data after clearing repositories", async () => {
    const call_order = [] as string[];
    vi.mocked(reset_all_local_repositories).mockImplementation(async () => {
      call_order.push("reset_team");
      return true;
    });
    vi.mocked(seed_all_data_if_needed).mockImplementation(async () => {
      call_order.push("seed");
      return { success: true as const, data: true };
    });

    await reset_all_data(ignore_progress);

    expect(call_order.indexOf("reset_team")).toBeLessThan(
      call_order.indexOf("seed"),
    );
  });

  it("reports progress milestones via the callback", async () => {
    const reported_steps = [] as Array<{ message: string; percentage: number }>;

    await reset_all_data((message, percentage) => {
      reported_steps.push({ message, percentage });
    });

    expect(reported_steps.length).toBeGreaterThan(0);
    expect(reported_steps[0].percentage).toBeLessThanOrEqual(10);
    const last_step = reported_steps[reported_steps.length - 1];
    expect(last_step.percentage).toBeGreaterThanOrEqual(90);
  });

  it("reports progress in ascending order", async () => {
    const percentages = [] as number[];

    await reset_all_data((_message, percentage) => {
      percentages.push(percentage);
    });

    for (let i = 1; i < percentages.length; i++) {
      expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1]);
    }
  });

  it("works without a progress callback (no crash)", async () => {
    const result = await reset_all_data(ignore_progress);
    expect(result).toBe(true);
  });
});
