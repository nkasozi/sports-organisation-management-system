import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolve_conflict } from "./syncConflictResolution";
import type { ConflictResolutionRequest, ConvexClient } from "./syncTypes";

const mock_sync_data_access = vi.hoisted(() => ({
  get_database: vi.fn(),
  apply_resolved_remote_record: vi.fn(async () => true),
}));

vi.mock("./syncDataAccess", () => ({
  get_database: mock_sync_data_access.get_database,
}));

vi.mock("./syncRemoteApplyRecords", () => ({
  apply_resolved_remote_record:
    mock_sync_data_access.apply_resolved_remote_record,
  ResolvedRecordGuardKind: { CONFLICTED_ENTRY: "conflicted_entry" },
}));

function create_request(
  overrides: Partial<ConflictResolutionRequest> = {},
): ConflictResolutionRequest {
  return {
    table_name: "teams",
    local_id: "team-1" as ConflictResolutionRequest["local_id"],
    resolved_data: { name: "Updated Team" },
    resolution_action: "keep_local",
    ...overrides,
  };
}

describe("syncConflictResolution", () => {
  const mock_convex_client = {
    mutation: vi.fn(),
    query: vi.fn(),
  } as unknown as ConvexClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mock_sync_data_access.get_database.mockReturnValue({});
  });

  it("returns success and omits resolved_by when no resolver is provided", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockResolvedValue(
      { success: true, server_version: 6 },
    );

    const result = await resolve_conflict(mock_convex_client, create_request());

    expect(result).toEqual({ success: true, data: true });
    expect(mock_convex_client.mutation).toHaveBeenCalledWith(
      "sync:force_resolve_conflict",
      expect.not.objectContaining({ resolved_by: void 0 }),
    );
  });

  it("returns failure when the mutation throws", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("mutation failed"),
    );

    const result = await resolve_conflict(
      mock_convex_client,
      create_request({ resolved_by: "user-1" as never }),
    );

    expect(result).toEqual({ success: false, error: "mutation failed" });
  });

  it("stores the resolved copy with the server-assigned version without re-enqueueing it", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockResolvedValue(
      { success: true, server_version: 6 },
    );

    const resolution_result = await resolve_conflict(
      mock_convex_client,
      create_request(),
    );

    expect(resolution_result.success).toBe(true);
    expect(
      mock_sync_data_access.apply_resolved_remote_record,
    ).toHaveBeenCalledWith(
      expect.anything(),
      "teams",
      {
        local_id: "team-1",
        server_version: 6,
        local_data: { name: "Updated Team", id: "team-1" },
      },
      { kind: "conflicted_entry" },
    );
  });

  it("fails instead of storing version 0 when the server omits the new version", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockResolvedValue(
      { success: true },
    );

    const result = await resolve_conflict(mock_convex_client, create_request());

    expect(result.success).toBe(false);
    expect(
      mock_sync_data_access.apply_resolved_remote_record,
    ).not.toHaveBeenCalled();
  });

  it("fails and leaves local data untouched when the server rejects the resolution", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockResolvedValue(
      { success: false, error: "Access denied" },
    );

    const result = await resolve_conflict(mock_convex_client, create_request());

    expect(result).toEqual({ success: false, error: "Access denied" });
    expect(
      mock_sync_data_access.apply_resolved_remote_record,
    ).not.toHaveBeenCalled();
  });
});
