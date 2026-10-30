import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { run_seeding_with_strategy } from "./appSeedingOrchestrator";
import {
  create_convex_required_seed_result,
  create_failed_seed_result,
  create_offline_mode_seed_result,
  create_skipped_seed_result,
} from "./seedResults";

const mocks = vi.hoisted(() => ({
  seed_from_convex_or_local: vi.fn(),
  update_progress: vi.fn(),
  complete_setup: vi.fn(),
  set_online: vi.fn(),
  set_offline: vi.fn(),
  set_setting: vi.fn(),
}));

vi.mock("./seedingService", () => ({
  seed_from_convex_or_local: mocks.seed_from_convex_or_local,
}));
vi.mock("$lib/presentation/stores/firstTimeSetup", () => ({
  first_time_setup_store: {
    update_progress: mocks.update_progress,
    complete_setup: mocks.complete_setup,
  },
}));
vi.mock("$lib/presentation/stores/appStatus", () => ({
  app_status_store: {
    set_online: mocks.set_online,
    set_offline: mocks.set_offline,
  },
}));
vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({ set_setting: mocks.set_setting }),
}));

describe("run_seeding_with_strategy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function run(
    strategy: Parameters<typeof run_seeding_with_strategy>[0],
    is_first_time: boolean,
  ): Promise<string> {
    const pending = run_seeding_with_strategy(strategy, is_first_time);
    await vi.runAllTimersAsync();
    return pending;
  }

  it("skips seeding without touching progress for returning users", async () => {
    expect(await run("skip_seeding", false)).toBe("success");
    expect(mocks.seed_from_convex_or_local).not.toHaveBeenCalled();
    expect(mocks.update_progress).not.toHaveBeenCalled();
  });

  it("redirects to login when server data is required but unavailable", async () => {
    mocks.seed_from_convex_or_local.mockResolvedValue(
      create_convex_required_seed_result("Server down"),
    );
    expect(await run("convex_mandatory", true)).toBe("redirect_to_login");
    expect(mocks.update_progress).toHaveBeenCalledWith("Server down", 0);
    expect(mocks.complete_setup).toHaveBeenCalled();
    expect(mocks.set_setting).not.toHaveBeenCalled();
  });

  it("switches to offline mode with the user-facing reason", async () => {
    mocks.seed_from_convex_or_local.mockResolvedValue(
      create_offline_mode_seed_result("Using saved data"),
    );
    expect(await run("convex_mandatory", false)).toBe("success");
    expect(mocks.set_offline).toHaveBeenCalledWith("Using saved data");
  });

  it("shows the failure message on first-time setup and logs the failure", async () => {
    mocks.seed_from_convex_or_local.mockResolvedValue(
      create_failed_seed_result("Unable to prepare offline data"),
    );
    expect(await run("local_only", true)).toBe("success");
    expect(mocks.update_progress).toHaveBeenCalledWith(
      "Unable to prepare offline data",
      0,
    );
    expect(console.error).toHaveBeenCalledWith(
      "[AppInitializer] Seeding failed",
      expect.objectContaining({ event: "app_seeding_failed" }),
    );
  });

  it("prepares the public view from server data for signed-out visitors", async () => {
    mocks.seed_from_convex_or_local.mockResolvedValue(
      create_skipped_seed_result(),
    );
    expect(await run("public_server_data", false)).toBe("success");
    expect(mocks.seed_from_convex_or_local).toHaveBeenCalledWith(
      expect.any(Function),
      "public_server_data",
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("explains when old demo data could not be cleared", async () => {
    mocks.seed_from_convex_or_local.mockResolvedValue(
      create_failed_seed_result("Old demo data could not be cleared"),
    );
    expect(await run("public_server_data", true)).toBe("success");
    expect(mocks.update_progress).toHaveBeenCalledWith(
      "Old demo data could not be cleared",
      0,
    );
  });
});
