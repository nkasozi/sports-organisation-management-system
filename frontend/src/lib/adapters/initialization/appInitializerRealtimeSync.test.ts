import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  initialize_app_data,
  reset_initialization,
  start_realtime_sync_for_signed_in_session,
} from "./appInitializer";
import {
  app_initializer_mocks as mocks,
  app_initializer_test_state as state,
  get_org_settings_pulled_handler,
  ORGANIZATION_SETTINGS_SYNC_INTERVAL_MS,
  prepare_app_initializer_test,
  SCOPED_ORGANIZATION_ID,
  TABLE_CHANGE_MARKER_QUERY,
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

describe("initialize_app_data real-time sync wiring", () => {
  it("skips Convex wiring when the Convex client is unavailable", async () => {
    state.is_signed_in.set(true);
    mocks.initialize_convex_client.mockReturnValue({
      success: false,
      error: "No PUBLIC_CONVEX_URL configured",
    });

    await expect(
      initialize_app_data({ ...OPTIONS, session_already_synced: true }),
    ).resolves.toBe("success");

    expect(mocks.start_auth_cache_invalidation).not.toHaveBeenCalled();
    expect(mocks.run_seeding_with_strategy).toHaveBeenCalledWith(
      "skip_seeding",
      false,
    );
    expect(mocks.start_realtime_sync).not.toHaveBeenCalled();
  });

  it("wires real-time sync for a signed-in user", async () => {
    state.is_signed_in.set(true);

    await initialize_app_data(OPTIONS);

    const [client, bridge, marker_query] =
      mocks.start_realtime_sync.mock.calls[0];
    expect(client).toBe(state.convex_client);
    expect(marker_query).toBe(TABLE_CHANGE_MARKER_QUERY);
    await bridge.query("sync:list", { table_name: "teams" });
    await bridge.mutation("sync:push", { table_name: "teams" });
    expect(state.convex_client.query).toHaveBeenCalledWith("sync:list", {
      table_name: "teams",
    });
    expect(state.convex_client.mutation).toHaveBeenCalledWith("sync:push", {
      table_name: "teams",
    });
    expect(mocks.configure_orchestrator).toHaveBeenCalledWith(
      state.sync_orchestrator,
    );
    expect(mocks.configure_remote_subscriber).toHaveBeenCalledWith(
      state.realtime_adapter,
    );
  });

  it("starts real-time sync later when the user signs in after start-up", async () => {
    await initialize_app_data(OPTIONS);
    expect(mocks.start_realtime_sync).not.toHaveBeenCalled();
    state.is_signed_in.set(true);

    expect(start_realtime_sync_for_signed_in_session()).toBe(true);
    expect(start_realtime_sync_for_signed_in_session()).toBe(false);
    expect(mocks.start_realtime_sync).toHaveBeenCalledTimes(1);
  });

  it("does not start real-time sync for a signed-out device", async () => {
    await initialize_app_data(OPTIONS);

    expect(start_realtime_sync_for_signed_in_session()).toBe(false);
    expect(mocks.start_realtime_sync).not.toHaveBeenCalled();
  });

  it("refreshes branding and the sync interval when organization settings are pulled", async () => {
    state.is_signed_in.set(true);
    await initialize_app_data(OPTIONS);
    const on_table_pulled = get_org_settings_pulled_handler();

    await on_table_pulled("teams");
    expect(mocks.get_by_organization_id).not.toHaveBeenCalled();

    await on_table_pulled("organization_settings");
    expect(mocks.get_by_organization_id).toHaveBeenCalledWith(
      SCOPED_ORGANIZATION_ID,
    );
    expect(mocks.refresh_from_organization_settings).toHaveBeenCalledWith(
      state.organization_settings,
    );
    expect(mocks.configure_scheduled_interval).toHaveBeenCalledWith(
      ORGANIZATION_SETTINGS_SYNC_INTERVAL_MS,
    );
  });

  it("ignores pulled organization settings without a scoped organization or settings", async () => {
    state.is_signed_in.set(true);
    await initialize_app_data(OPTIONS);
    const on_table_pulled = get_org_settings_pulled_handler();

    mocks.get_current_org_id_state.mockReturnValueOnce({ status: "unscoped" });
    await on_table_pulled("organization_settings");
    mocks.get_by_organization_id.mockResolvedValueOnce({
      success: false,
      error: "missing",
    });
    await on_table_pulled("organization_settings");

    expect(mocks.get_by_organization_id).toHaveBeenCalledTimes(1);
    expect(mocks.refresh_from_organization_settings).not.toHaveBeenCalled();
    expect(mocks.configure_scheduled_interval).not.toHaveBeenCalled();
  });

  it("routes restoration handlers to the real-time adapter", async () => {
    state.is_signed_in.set(true);
    await initialize_app_data(OPTIONS);

    const handlers = mocks.configure_restoration_handlers.mock.calls[0][0];
    handlers.stop_remote_sync();
    handlers.start_remote_sync();

    expect(state.realtime_adapter.stop).toHaveBeenCalledTimes(1);
    expect(state.realtime_adapter.start).toHaveBeenCalledTimes(1);
  });
});
