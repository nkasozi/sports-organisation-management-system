import { beforeEach, describe, expect, it, vi } from "vitest";

const dexie_mock_state = vi.hoisted(() => {
  const created_instances: Array<{
    close: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    version: ReturnType<typeof vi.fn>;
  }> = [];

  class MockDexie {
    static delete = vi.fn(async (_database_name: string) => {});

    close = vi.fn();
    delete = vi.fn(async () => {});
    version = vi.fn(() => ({ stores: vi.fn() }));

    constructor(_database_name: string) {
      created_instances.push(this);
    }
  }

  function reset(): void {
    created_instances.length = 0;
    MockDexie.delete.mockReset();
    MockDexie.delete.mockResolvedValue(undefined);
  }

  return {
    MockDexie,
    created_instances,
    reset,
  };
});

vi.mock("dexie", () => ({
  default: dexie_mock_state.MockDexie,
}));

describe("database reset", () => {
  beforeEach(() => {
    vi.resetModules();
    dexie_mock_state.reset();
  });

  it("drops the persisted database before opening a fresh runtime instance", async () => {
    const database_module = await import("./database");

    await database_module.reset_database();

    expect(dexie_mock_state.MockDexie.delete).toHaveBeenCalledWith(
      "SportSyncDB",
    );
    expect(dexie_mock_state.created_instances).toHaveLength(1);
  });

  it("replaces an existing runtime database instance during reset", async () => {
    const database_module = await import("./database");

    const first_database = database_module.get_database() as unknown as {
      close: ReturnType<typeof vi.fn>;
    };

    await database_module.reset_database();

    const second_database = database_module.get_database();

    expect(first_database.close).toHaveBeenCalledOnce();
    expect(dexie_mock_state.MockDexie.delete).toHaveBeenCalledWith(
      "SportSyncDB",
    );
    expect(second_database).not.toBe(first_database);
  });
});
