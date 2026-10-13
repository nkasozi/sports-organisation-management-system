import { describe, expect, it, type MockedFunction, vi } from "vitest";

const auth_state = vi.hoisted(() => {
  let current_value = false;

  return {
    is_signed_in: {
      subscribe(run: (value: boolean) => void) {
        run(current_value);
        return () => {};
      },
    },
    set_signed_in(value: boolean) {
      current_value = value;
    },
  };
});

const mock_app_settings_store = {} as Record<string, string>;
const mock_remove_setting = vi.fn((key: string) => {
  delete mock_app_settings_store[key];
  return Promise.resolve();
});

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: (key: string) =>
      Promise.resolve(mock_app_settings_store[key] ?? ""),
    set_setting: (key: string, value: string) => {
      mock_app_settings_store[key] = value;
      return Promise.resolve();
    },
    remove_setting: mock_remove_setting,
    clear_all_settings: () => {
      Object.keys(mock_app_settings_store).forEach(
        (k) => delete mock_app_settings_store[k],
      );
      return Promise.resolve();
    },
  }),
}));

vi.mock("../../adapters/iam/clerkAuthService", () => ({
  is_signed_in: auth_state.is_signed_in,
}));

interface ConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

interface MockConvexClient extends ConvexClient {
  mutation: MockedFunction<ConvexClient["mutation"]>;
  query: MockedFunction<ConvexClient["query"]>;
}

function create_mock_convex_client(): MockConvexClient {
  return {
    mutation: vi.fn() as MockedFunction<ConvexClient["mutation"]>,
    query: vi.fn() as MockedFunction<ConvexClient["query"]>,
  } as MockConvexClient;
}

describe("ConvexSyncManager", () => {
  it("creates with default config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();
    const config = manager.get_config();

    expect(config.convex_url).toBe("");
    expect(config.sync_interval_ms).toBe(30000);
    expect(config.direction).toBe("bidirectional");
    expect(config.enabled_tables.length).toBeGreaterThan(0);
  }, 30_000);

  it("creates with custom config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager({
      convex_url: "https://test.convex.cloud",
      sync_interval_ms: 60000,
      direction: "push",
    });
    const config = manager.get_config();

    expect(config.convex_url).toBe("https://test.convex.cloud");
    expect(config.sync_interval_ms).toBe(60000);
    expect(config.direction).toBe("push");
  });

  it("reports not configured when no client is set", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();
    expect(manager.is_configured()).toBe(false);
  });

  it("reports configured after client and url are set", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager({
      convex_url: "https://test.convex.cloud",
    });
    manager.set_convex_client(create_mock_convex_client());
    expect(manager.is_configured()).toBe(true);
  });

  it("returns error result when syncing without configured client", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    const result = await manager.sync_now();

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("not configured");
  });

  it("reports syncing status correctly", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    expect(manager.get_sync_status()).toBe("idle");
  });

  it("updates config via update_config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    manager.update_config({ sync_interval_ms: 5000 });
    const config = manager.get_config();

    expect(config.sync_interval_ms).toBe(5000);
  });

  it("returns defensive copy of config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    const config1 = manager.get_config();
    const config2 = manager.get_config();

    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});

describe("get_last_sync_timestamp", () => {
  it("returns EPOCH_TIMESTAMP", async () => {
    const { get_last_sync_timestamp } = await import("./convexSyncService");
    const result = get_last_sync_timestamp();
    expect(result).toBe("1970-01-01T00:00:00.000Z");
  });
});

describe("reset_sync_metadata", () => {
  it("removes convex_sync_metadata via AppSettingsPort", async () => {
    mock_app_settings_store["convex_sync_metadata"] = JSON.stringify({
      last_synced: "2024-01-01T00:00:00.000Z",
    });
    mock_remove_setting.mockClear();

    const { reset_sync_metadata } = await import("./convexSyncService");
    await reset_sync_metadata();

    expect(mock_remove_setting).toHaveBeenCalledWith("convex_sync_metadata");
  });
});

describe("initialize_sync_manager", () => {
  it("creates a new manager with provided config", async () => {
    const { initialize_sync_manager } = await import("./convexSyncService");
    const manager = initialize_sync_manager({
      convex_url: "https://test.convex.cloud",
      sync_interval_ms: 15000,
    });

    const config = manager.get_config();
    expect(config.convex_url).toBe("https://test.convex.cloud");
    expect(config.sync_interval_ms).toBe(15000);
  });

  it("replaces the singleton instance", async () => {
    const { initialize_sync_manager, get_sync_manager } =
      await import("./convexSyncService");
    const manager = initialize_sync_manager({
      convex_url: "https://new-instance.convex.cloud",
    });

    const retrieved = get_sync_manager();
    expect(retrieved).toBe(manager);
  });
});
