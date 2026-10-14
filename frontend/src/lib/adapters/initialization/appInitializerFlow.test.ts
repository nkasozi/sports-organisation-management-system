import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialize_app_data, reset_initialization } from "./appInitializer";
import {
  app_initializer_mocks as mocks,
  app_initializer_test_state as state,
  FIRST_TIME_DETECTION_KEY,
  prepare_app_initializer_test,
} from "./appInitializer.test_support";

const load_mocks = vi.hoisted(
  () => async () =>
    (await import("./appInitializer.test_support")).module_mocks,
);

vi.mock("$convex/_generated/api", async () => (await load_mocks()).api);
vi.mock(
  "$lib/adapters/iam/clerkAuthService",
  async () => (await load_mocks()).clerk,
);
vi.mock(
  "$lib/infrastructure/container",
  async () => (await load_mocks()).container,
);
vi.mock(
  "$lib/infrastructure/handlers/AuditEventHandler",
  async () => (await load_mocks()).audit,
);
vi.mock(
  "$lib/infrastructure/registry/useCaseFactories",
  async () => (await load_mocks()).use_case_factories,
);
vi.mock(
  "$lib/infrastructure/sync/backgroundSyncService",
  async () => (await load_mocks()).background_sync,
);
vi.mock(
  "$lib/infrastructure/sync/convexRealtimeSync",
  async () => (await load_mocks()).realtime_sync,
);
vi.mock(
  "$lib/presentation/stores/branding",
  async () => (await load_mocks()).stores,
);
vi.mock(
  "$lib/presentation/stores/firstTimeSetup",
  async () => (await load_mocks()).stores,
);
vi.mock(
  "$lib/presentation/stores/syncStore",
  async () => (await load_mocks()).stores,
);
vi.mock(
  "./appConvexInitializer",
  async () => (await load_mocks()).convex_initializer,
);
vi.mock(
  "./appSeedingOrchestrator",
  async () => (await load_mocks()).seeding_orchestrator,
);
vi.mock(
  "./appUseCaseInitializer",
  async () => (await load_mocks()).use_case_initializer,
);
vi.mock("./seedingService", async () => (await load_mocks()).seeding_service);

const OPTIONS = { current_path: "/players", session_already_synced: false };

beforeEach(() => {
  prepare_app_initializer_test();
  reset_initialization();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("initialize_app_data", () => {
  it("does nothing outside the browser", async () => {
    vi.unstubAllGlobals();

    await expect(initialize_app_data(OPTIONS)).resolves.toBe("success");
    expect(mocks.initialize_clerk).not.toHaveBeenCalled();
  });

  it("initializes a signed-out returning user locally exactly once", async () => {
    await expect(initialize_app_data(OPTIONS)).resolves.toBe("success");
    await expect(initialize_app_data(OPTIONS)).resolves.toBe("success");

    expect(mocks.initialize_clerk).toHaveBeenCalledTimes(1);
    expect(mocks.initialize_audit_event_handlers).toHaveBeenCalledTimes(1);
    expect(mocks.initialize_all_use_cases).toHaveBeenCalledTimes(1);
    expect(mocks.start_auth_cache_invalidation).toHaveBeenCalledWith(
      state.convex_client,
    );
    expect(mocks.run_seeding_with_strategy).toHaveBeenCalledWith(
      "local_only",
      false,
    );
    expect(mocks.set_first_time).not.toHaveBeenCalled();
    expect(mocks.start_realtime_sync).not.toHaveBeenCalled();
  });

  it("reports first-time setup progress before seeding", async () => {
    vi.useFakeTimers();
    delete state.app_settings[FIRST_TIME_DETECTION_KEY];

    const pending_result = initialize_app_data(OPTIONS);
    await vi.runAllTimersAsync();

    await expect(pending_result).resolves.toBe("success");
    expect(mocks.set_first_time).toHaveBeenCalledWith(true);
    expect(mocks.start_setup).toHaveBeenCalledTimes(1);
    expect(mocks.update_progress.mock.calls).toEqual([
      ["Initializing audit system...", 10],
      ["Setting up data repositories...", 20],
    ]);
    expect(mocks.run_seeding_with_strategy).toHaveBeenCalledWith(
      "local_only",
      true,
    );
  });

  it("waits for Clerk to load before reading the sign-in state", async () => {
    state.is_clerk_loaded.set(false);

    const pending_result = initialize_app_data(OPTIONS);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.initialize_all_use_cases).not.toHaveBeenCalled();
    state.is_signed_in.set(true);
    state.is_clerk_loaded.set(true);

    await expect(pending_result).resolves.toBe("success");
    expect(mocks.run_seeding_with_strategy).toHaveBeenCalledWith(
      "skip_seeding",
      false,
    );
  });

  it("returns redirect_to_login without marking the app initialized", async () => {
    mocks.run_seeding_with_strategy.mockResolvedValue("redirect_to_login");

    await expect(initialize_app_data(OPTIONS)).resolves.toBe(
      "redirect_to_login",
    );
    await initialize_app_data(OPTIONS);

    expect(mocks.initialize_clerk).toHaveBeenCalledTimes(2);
    expect(mocks.start_realtime_sync).not.toHaveBeenCalled();
  });
});
