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

describe("handle_entity_updated — additional coverage", () => {
  it("records all changed fields when multiple fields are updated", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_updated(
      "Player",
      "player-1",
      "Jane",
      { first_name: "Jane", jersey_number: "10" },
      { first_name: "Janet", jersey_number: "7" },
      ["first_name", "jersey_number"],
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.changes).toHaveLength(2);
    expect(call_arg.changes[0]).toEqual({
      field_name: "first_name",
      old_value: "Jane",
      new_value: "Janet",
    });
    expect(call_arg.changes[1]).toEqual({
      field_name: "jersey_number",
      old_value: "10",
      new_value: "7",
    });
  });

  it("coerces null and undefined field values to empty string", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_entity_updated(
      "Player",
      "player-2",
      "Anon",
      { nickname: JSON.parse("null") },
      { nickname: void 0 },
      ["nickname"],
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.changes[0].old_value).toBe("");
    expect(call_arg.changes[0].new_value).toBe("");
  });

  it("uses user_context fields when a user is set", async () => {
    initialize_audit_event_handlers();
    set_user_context({
      user_id: "u-99",
      user_email: "carol@example.com",
      user_display_name: "Carol",
      organization_id: "org-9",
    });

    EventBus.emit_entity_updated(
      "Team",
      "team-5",
      "Red Bulls",
      { name: "Bulls" },
      { name: "Red Bulls" },
      ["name"],
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("u-99");
    expect(call_arg.user_email).toBe("carol@example.com");
    expect(call_arg.organization_id).toBe("org-9");
  });
});
