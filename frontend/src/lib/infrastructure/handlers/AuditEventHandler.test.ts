import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clear_user_context,
  EventBus,
  set_user_context,
} from "../events/EventBus";
import {
  initialize_audit_event_handlers,
  reset_audit_event_handlers,
} from "./AuditEventHandler";

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

    EventBus.emit_entity_created("Team", "team-1", "City FC", {
      name: "City FC",
    });

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
    expect(call_arg.user_email).toBe("system@sport-sync.local");
    expect(call_arg.organization_id).toBe("*");
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

describe("reset_audit_event_handlers", () => {
  it("allows re-initialization after a reset — initialize returns true again", () => {
    initialize_audit_event_handlers();
    reset_audit_event_handlers();
    expect(initialize_audit_event_handlers()).toBe(true);
  });
});

describe("handle_entity_deleted — additional coverage", () => {
  it("uses user_context fields when a user is set", async () => {
    initialize_audit_event_handlers();
    set_user_context({
      user_id: "u-55",
      user_email: "dave@example.com",
      user_display_name: "Dave",
      organization_id: "org-2",
    });

    EventBus.emit_entity_deleted("Fixture", "fix-20", "Round 3", {});
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("u-55");
    expect(call_arg.user_email).toBe("dave@example.com");
    expect(call_arg.organization_id).toBe("org-2");
  });

  it("falls back to system values when no user_context is set", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_deleted("Venue", "venue-3", "Central Park", {});
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("system");
    expect(call_arg.user_email).toBe("system@sport-sync.local");
    expect(call_arg.organization_id).toBe("*");
  });
});
