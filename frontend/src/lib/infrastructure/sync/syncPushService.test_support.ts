import { type Mock, vi } from "vitest";

import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  create_fake_sync_database,
  type FakeSyncDatabase,
} from "./syncFakeDatabase.test_support";
import type { PushTableOutboxCommand } from "./syncPushTransport";
import type { ConvexClient } from "./syncTypes";

export function build_entry(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    table_name: "teams",
    local_id: "team_a",
    operation: "upsert",
    base_version: { kind: "known", version: 4 },
    change_token: "token_1",
    enqueued_at: "2024-01-01T00:00:00.000Z",
    status: "pending",
    ...overrides,
  };
}

interface PushCommandHarness {
  fake: FakeSyncDatabase;
  mutation: Mock;
  command: PushTableOutboxCommand;
}

export function create_command(
  mutation_responses: unknown[],
): PushCommandHarness {
  const fake = create_fake_sync_database();
  const mutation = vi.fn();
  mutation_responses.forEach((response) =>
    mutation.mockResolvedValueOnce(response),
  );
  const convex_client: ConvexClient = { query: vi.fn(), mutation };
  return {
    fake,
    mutation,
    command: {
      convex_client,
      database: fake.database,
      gate: create_change_tracking_gate(),
      table_name: "teams" as const,
      detect_conflicts: true,
      correlation_id: "run_1",
    },
  };
}

export function upsert_response(
  action: string,
  success = true,
  server_version = 5,
): Record<string, unknown> {
  return {
    success: true,
    results: [{ local_id: "team_a", success, action, server_version }],
    has_conflicts: action === "conflict_detected",
    deleted_remotely: [],
    conflicts:
      action === "conflict_detected"
        ? [
            {
              local_id: "team_a",
              local_data: { name: "Mine" },
              local_version: 4,
              remote_data: { name: "Theirs" },
              remote_version: 7,
              remote_updated_at: "2024-02-01T00:00:00.000Z",
            },
          ]
        : [],
  };
}
