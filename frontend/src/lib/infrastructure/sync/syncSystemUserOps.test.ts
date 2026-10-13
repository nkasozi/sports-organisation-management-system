import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { create_some_option } from "$lib/core/types/Option";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import {
  pull_user_scoped_record_from_convex,
  write_convex_user_to_local_dexie,
} from "./syncSystemUserOps";
import type { ConvexClient } from "./syncTypes";

const mock_sync_data_access = vi.hoisted(() => ({
  get_database: vi.fn(),
  get_table_from_database: vi.fn(),
}));

vi.mock("./syncDataAccess", () => ({
  get_database: mock_sync_data_access.get_database,
  get_table_from_database: mock_sync_data_access.get_table_from_database,
}));

describe("syncSystemUserOps", () => {
  const mock_table_put = vi.fn();
  const mock_convex_client = {
    query: vi.fn(),
    mutation: vi.fn(),
  } as unknown as ConvexClient;

  let fake = create_fake_sync_database();

  beforeEach(() => {
    vi.clearAllMocks();
    fake = create_fake_sync_database();
    mock_sync_data_access.get_database.mockReturnValue(fake.database);
    mock_sync_data_access.get_table_from_database.mockReturnValue({
      put: mock_table_put,
    });
  });

  it("returns failure when the Convex client is unavailable", async () => {
    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({
          success: false,
          error: "Convex client not initialized",
        }),
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Convex client not initialized",
    });
  });

  it("returns success false when the scoped record does not exist", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "not_found",
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({ success: true, data: false });
    expect(mock_table_put).not.toHaveBeenCalled();
  });

  it("returns failure when the lookup reports an access error", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "failure",
      error: "Access denied",
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to pull teams record: Access denied",
    });
    expect(mock_table_put).not.toHaveBeenCalled();
  });

  it("applies the found record as a remote change that is never re-queued for push", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "found",
      record: {
        _id: "convex-doc-id",
        _creationTime: 123,
        id: "ignored-convex-id",
        local_id: "team-1",
        synced_at: "2024-01-01T00:00:00.000Z",
        version: 4,
        name: "Team A",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({ success: true, data: true });
    expect(fake.rows("teams")).toEqual([
      { id: "team-1", name: "Team A", created_at: "2024-01-01T00:00:00.000Z" },
    ]);
    expect(fake.rows("sync_record_versions")).toEqual([
      { table_name: "teams", local_id: "team-1", server_version: 4 },
    ]);
    expect(
      sync_change_tracking_gate.describe_untracked_reason(
        fake.transaction_markers[0],
      ),
    ).toEqual(create_some_option(UntrackedWriteReason.REMOTE_APPLY));
  });

  it("writes the signed-in Convex user locally as a remote change", async () => {
    const user_id = await write_convex_user_to_local_dexie({
      local_id: "usr_1",
      email: "Admin@Example.com",
      role: "org_admin",
      organization_id: "org_1",
    });
    expect(user_id).toBe("usr_1");
    expect(fake.rows("system_users")[0]).toMatchObject({
      id: "usr_1",
      email: "admin@example.com",
      organization_id: "org_1",
    });
    expect(
      sync_change_tracking_gate.describe_untracked_reason(
        fake.transaction_markers[0],
      ),
    ).toEqual(create_some_option(UntrackedWriteReason.REMOTE_APPLY));
  });
});
