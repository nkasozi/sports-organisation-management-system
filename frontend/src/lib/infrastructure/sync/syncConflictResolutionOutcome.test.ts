import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolve_conflict_with_outcome } from "./syncConflictResolution";
import type { ConflictResolutionRequest, ConvexClient } from "./syncTypes";

const mocks = vi.hoisted(() => ({
  apply_resolved_remote_record: vi.fn(async () => "applied"),
}));

vi.mock("./syncDataAccess", () => ({ get_database: vi.fn(() => ({})) }));

vi.mock("./syncRemoteApplyRecords", () => ({
  apply_resolved_remote_record: mocks.apply_resolved_remote_record,
  ResolvedRecordGuardKind: { CONFLICTED_ENTRY: "conflicted_entry" },
}));

const REQUEST: ConflictResolutionRequest = {
  table_name: "teams",
  local_id: "team-1" as ConflictResolutionRequest["local_id"],
  resolved_data: { name: "Updated Team" },
  resolution_action: "keep_local",
  base_version: 5,
};

function client_answering(response: unknown): ConvexClient {
  return {
    mutation: vi.fn().mockResolvedValue(response),
    query: vi.fn(),
  } as unknown as ConvexClient;
}

describe("resolve_conflict_with_outcome", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports a resolved conflict with the new server version", async () => {
    const outcome = await resolve_conflict_with_outcome(
      client_answering({ success: true, server_version: 6 }),
      REQUEST,
    );

    expect(outcome).toEqual({ kind: "resolved", server_version: 6 });
    expect(mocks.apply_resolved_remote_record).toHaveBeenCalledWith(
      expect.anything(),
      "teams",
      {
        local_id: "team-1",
        server_version: 6,
        server_sequence: 0,
        local_data: { name: "Updated Team", id: "team-1" },
      },
      { kind: "conflicted_entry" },
    );
  });

  it("reports that the record changed again on the server", async () => {
    const outcome = await resolve_conflict_with_outcome(
      client_answering({
        success: false,
        error: "write_rejected",
        action: "conflict_detected",
        server_version: 8,
      }),
      REQUEST,
    );

    expect(outcome).toEqual({
      kind: "remote_changed_again",
      server_version: 8,
    });
    expect(mocks.apply_resolved_remote_record).not.toHaveBeenCalled();
  });

  it("reports that the record was deleted on the server", async () => {
    const outcome = await resolve_conflict_with_outcome(
      client_answering({
        success: false,
        error: "write_rejected",
        action: "deleted_remotely",
        server_version: 9,
      }),
      REQUEST,
    );

    expect(outcome).toEqual({ kind: "deleted_remotely", tombstone_version: 9 });
  });

  it("reports a failure when the server cannot be reached", async () => {
    const client = {
      mutation: vi.fn().mockRejectedValue(new Error("offline")),
      query: vi.fn(),
    } as unknown as ConvexClient;

    expect(await resolve_conflict_with_outcome(client, REQUEST)).toEqual({
      kind: "failed",
      error: "offline",
    });
  });
});
