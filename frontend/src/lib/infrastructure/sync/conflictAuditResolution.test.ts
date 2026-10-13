import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateAuditLogInput } from "$lib/core/entities/AuditLog";

import { log_conflict_resolution } from "./conflictAuditService";
import {
  type ConflictRecord,
  create_unknown_conflict_field_value,
} from "./conflictTypes";

const created_inputs: CreateAuditLogInput[] = [];
const repository_state = { should_fail: false };

vi.mock("$lib/infrastructure/container", () => ({
  get_repository_container: () => ({
    audit_log_repository: {
      create: async (
        input: CreateAuditLogInput,
      ): Promise<{ success: true; data: CreateAuditLogInput }> => {
        if (repository_state.should_fail) {
          return Promise.reject(new Error("repository_unavailable"));
        }
        created_inputs.push(input);
        return { success: true, data: input };
      },
    },
  }),
}));

function create_conflict(): ConflictRecord {
  return {
    id: "conflict-1",
    table_name: "team_staff_roles",
    local_id: "local-1",
    entity_display_name: "Coach",
    local_data: {},
    remote_data: {},
    local_updated_at: "2024-01-01T00:00:00.000Z",
    remote_updated_at: "2024-01-02T00:00:00.000Z",
    remote_updated_by: create_unknown_conflict_field_value(),
    remote_updated_by_name: create_unknown_conflict_field_value(),
    field_differences: [
      {
        field_name: "name",
        local_value: "A",
        remote_value: { nested: 1 },
        display_name: "Name",
      },
      {
        field_name: "code",
        local_value: void 0,
        remote_value: 7,
        display_name: "Code",
      },
    ],
    detected_at: "2024-01-03T00:00:00.000Z",
  } as ConflictRecord;
}

describe("log_conflict_resolution", () => {
  beforeEach(() => {
    created_inputs.length = 0;
    repository_state.should_fail = false;
  });

  it("records keep_local resolution with default system context", async () => {
    const result = await log_conflict_resolution(
      create_conflict(),
      "keep_local",
      {},
    );

    expect(result).toBe(true);
    expect(created_inputs).toEqual([
      {
        entity_type: "Team Staff Roles",
        entity_id: "local-1",
        entity_display_name: "Coach",
        action: "sync_conflict_resolved",
        changes: [
          {
            field_name: "resolution_action",
            old_value: "conflict",
            new_value: "Kept local changes (overwrote server)",
          },
          {
            field_name: "resolution_source",
            old_value: "remote",
            new_value: "local",
          },
        ],
        user_id: "system",
        user_email: "system@sport-sync.local",
        user_display_name: "System",
        organization_id: "*",
        ip_address: "127.0.0.1",
        user_agent: "SportSyncApp/SyncService",
      },
    ]);
  });

  it("records keep_remote resolution with supplied context", async () => {
    await log_conflict_resolution(create_conflict(), "keep_remote", {}, {
      user_id: "user-9",
      user_email: "u@example.com",
      user_display_name: "User Nine",
      organization_id: "org-1",
    } as never);

    expect(created_inputs[0]).toMatchObject({
      user_id: "user-9",
      user_email: "u@example.com",
      user_display_name: "User Nine",
      organization_id: "org-1",
    });
    expect(created_inputs[0].changes).toEqual([
      {
        field_name: "resolution_action",
        old_value: "conflict",
        new_value: "Kept server version (discarded local)",
      },
      {
        field_name: "resolution_source",
        old_value: "local",
        new_value: "remote",
      },
    ]);
  });

  it("records each merged field with local, remote and resolved values", async () => {
    await log_conflict_resolution(create_conflict(), "merge", {
      name: "B",
    });

    expect(created_inputs[0].changes).toEqual([
      {
        field_name: "resolution_action",
        old_value: "conflict",
        new_value: "Manual merge of local and remote changes",
      },
      {
        field_name: "name",
        old_value: 'Local: A | Remote: {"nested":1}',
        new_value: "B",
      },
      {
        field_name: "code",
        old_value: "Local: undefined | Remote: 7",
        new_value: "undefined",
      },
    ]);
  });

  it("returns false and logs when the repository fails", async () => {
    repository_state.should_fail = true;
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await log_conflict_resolution(
      create_conflict(),
      "keep_local",
      {},
    );

    expect(result).toBe(false);
    expect(error_spy).toHaveBeenCalledWith(
      "[ConflictAudit] Failed to log conflict resolution",
      expect.objectContaining({
        event: "failed_to_log_conflict_resolution_failed",
      }),
    );
    error_spy.mockRestore();
  });
});
