import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_WRITE_ORIGIN } from "./InBrowserRepositoryWriteOrigin";
import {
  audit_after_write,
  audit_repository_change,
} from "./repositoryChangeAudit";

const { emit_mock } = vi.hoisted(() => ({ emit_mock: vi.fn(() => true) }));

vi.mock("$lib/infrastructure/events/entityChangeEvents", () => ({
  emit_entity_changed: emit_mock,
}));

const SYSTEM_ORIGIN = { kind: "system", scope: {} } as never;
const PLAYER = { id: "p1", first_name: "Moses" } as never;

describe("every user change to stored data is sent to the audit trail", () => {
  beforeEach(() => emit_mock.mockClear());

  it("sends creates, updates and deletes made by people", () => {
    audit_repository_change(
      { table_name: "players", origin: USER_WRITE_ORIGIN, action: "update" },
      PLAYER,
      { ...(PLAYER as object), first_name: "Moses A" } as never,
    );
    expect(emit_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: "player",
        entity_id: "p1",
        action: "update",
        before: PLAYER,
      }),
    );
  });

  it("ignores seeding, resets and other system writes", () => {
    expect(
      audit_repository_change(
        { table_name: "players", origin: SYSTEM_ORIGIN, action: "create" },
        false,
        PLAYER,
      ),
    ).toBe(false);
    expect(emit_mock).not.toHaveBeenCalled();
  });

  it("never audits the audit trail itself or private tokens", () => {
    for (const table_name of ["audit_logs", "calendar_tokens", "sync_outbox"])
      audit_repository_change(
        { table_name, origin: USER_WRITE_ORIGIN, action: "create" },
        false,
        PLAYER,
      );
    expect(emit_mock).not.toHaveBeenCalled();
  });

  it("only audits writes that succeeded", () => {
    const target = {
      table_name: "players",
      origin: USER_WRITE_ORIGIN,
      action: "create" as const,
    };
    const failed = audit_after_write(target, false, {
      success: false,
      error: "nope",
    });
    expect(failed.success).toBe(false);
    expect(emit_mock).not.toHaveBeenCalled();
    const saved = audit_after_write(target, false, {
      success: true,
      data: PLAYER,
    });
    expect(saved.success).toBe(true);
    expect(emit_mock).toHaveBeenCalledTimes(1);
  });
});
