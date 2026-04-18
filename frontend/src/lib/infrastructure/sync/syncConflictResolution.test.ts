import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolve_conflict } from "./syncConflictResolution";
import type { ConflictResolutionRequest, ConvexClient } from "./syncTypes";

const mock_sync_data_access = vi.hoisted(() => ({
  get_database: vi.fn(),
  get_table_from_database: vi.fn(),
}));

vi.mock("./syncDataAccess", () => ({
  get_database: mock_sync_data_access.get_database,
  get_table_from_database: mock_sync_data_access.get_table_from_database,
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
  const mock_put = vi.fn();
  const mock_convex_client = {
    mutation: vi.fn(),
    query: vi.fn(),
  } as unknown as ConvexClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mock_sync_data_access.get_database.mockReturnValue({});
    mock_sync_data_access.get_table_from_database.mockReturnValue({
      put: mock_put,
    });
  });

  it("returns success and omits resolved_by when no resolver is provided", async () => {
    (mock_convex_client.mutation as ReturnType<typeof vi.fn>).mockResolvedValue(
      void 0,
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
});
