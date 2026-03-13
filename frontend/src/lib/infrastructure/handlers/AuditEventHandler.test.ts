import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initialize_audit_event_handlers,
  reset_audit_event_handlers,
} from "./AuditEventHandler";
import {
  EventBus,
  set_user_context,
  clear_user_context,
} from "../events/EventBus";

const mock_create_audit_log = vi.fn().mockResolvedValue({ success: true });

vi.mock("../container", () => ({
  get_repository_container: vi.fn(() => ({
    audit_log_repository: {
      create: mock_create_audit_log,
    },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
  reset_audit_event_handlers();
});

afterEach(() => {
  reset_audit_event_handlers();
});

describe("initialize_audit_event_handlers", () => {
  it("returns true on first call", () => {
    expect(initialize_audit_event_handlers()).toBe(true);
  });

  it("returns false on subsequent calls (idempotent)", () => {
    initialize_audit_event_handlers();
    expect(initialize_audit_event_handlers()).toBe(false);
  });

  it("does not double-subscribe handlers when called multiple times", async () => {
    initialize_audit_event_handlers();
    initialize_audit_event_handlers();

    EventBus.emit_entity_created("Team", "team-1", "City FC", {});
    await Promise.resolve();
    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
  });
});

describe("handle_entity_created", () => {
  it("writes an audit log with action 'create'", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_created("Team", "team-1", "City FC", { name: "City FC" });

    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.action).toBe("create");
    expect(call_arg.entity_type).toBe("Team");
    expect(call_arg.entity_id).toBe("team-1");
    expect(call_arg.entity_display_name).toBe("City FC");
    expect(call_arg.changes).toEqual([]);
  });

  it("uses user_context fields when user is set", async () => {
    initialize_audit_event_handlers();
    set_user_context({
      user_id: "u-42",
      user_email: "alice@example.com",
      user_display_name: "Alice",
      organization_id: "org-7",
    });

    EventBus.emit_entity_created("Player", "player-1", "John", {});
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("u-42");
    expect(call_arg.user_email).toBe("alice@example.com");
    expect(call_arg.organization_id).toBe("org-7");
  });

  it("falls back to system values when no user_context set", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_created("Player", "player-1", "John", {});
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("system");
    expect(call_arg.user_email).toBe("system@sportsorg.local");
    expect(call_arg.organization_id).toBe("*");
  });
});

describe("handle_entity_updated", () => {
  it("writes an audit log with action 'update' and changed fields", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_updated(
      "Team",
      "team-1",
      "City FC",
      { name: "Old Name" },
      { name: "New Name" },
      ["name"],
    );
    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.action).toBe("update");
    expect(call_arg.changes).toHaveLength(1);
    expect(call_arg.changes[0].field_name).toBe("name");
    expect(call_arg.changes[0].old_value).toBe("Old Name");
    expect(call_arg.changes[0].new_value).toBe("New Name");
  });

  it("skips audit log write when changed_fields is empty", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_updated(
      "Team",
      "team-1",
      "City FC",
      { name: "Same" },
      { name: "Same" },
      [],
    );
    await Promise.resolve();

    expect(mock_create_audit_log).not.toHaveBeenCalled();
  });
});

describe("handle_entity_deleted", () => {
  it("writes an audit log with action 'delete'", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_deleted("Competition", "comp-1", "League Cup", {});
    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.action).toBe("delete");
    expect(call_arg.entity_type).toBe("Competition");
    expect(call_arg.changes).toEqual([]);
  });
});

describe("handle_access_denied", () => {
  it("writes an audit log with action 'access_denied'", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Player",
      "player-99",
      "read",
      "player_data",
      "insufficient_permissions",
      "viewer",
    );
    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.action).toBe("access_denied");
    expect(call_arg.entity_type).toBe("Player");
  });

  it("includes attempted_action and denial_reason in changes", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Team",
      "team-1",
      "delete",
      "team_roster",
      "role_too_low",
      "editor",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    const field_names = call_arg.changes.map(
      (c: { field_name: string }) => c.field_name,
    );
    expect(field_names).toContain("attempted_action");
    expect(field_names).toContain("denial_reason");
    expect(field_names).toContain("role");
  });

  it("includes context field in changes when context is provided", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Fixture",
      "fix-1",
      "update",
      "fixture_data",
      "cross_org_access",
      "admin",
      "user tried to access org-2 data from org-1 session",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    const field_names = call_arg.changes.map(
      (c: { field_name: string }) => c.field_name,
    );
    expect(field_names).toContain("context");
  });

  it("does not include context field when context is absent", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Fixture",
      "fix-1",
      "update",
      "fixture_data",
      "cross_org_access",
      "admin",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    const field_names = call_arg.changes.map(
      (c: { field_name: string }) => c.field_name,
    );
    expect(field_names).not.toContain("context");
  });

  it("falls back to anonymous values when no user_context set", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Team",
      "team-1",
      "read",
      "team_data",
      "unauthenticated",
      "none",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("anonymous");
    expect(call_arg.user_email).toBe("anonymous@unknown");
    expect(call_arg.organization_id).toBe("*");
  });
});
