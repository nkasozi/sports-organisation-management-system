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

describe("handle_page_viewed", () => {
  it("writes an audit log with action 'page_view'", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_page_viewed("/fixtures", "Fixtures");
    await Promise.resolve();

    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.action).toBe("page_view");
  });

  it("sets entity_type to 'page' and entity_id to the page_path", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_page_viewed("/competitions/league-1", "League One");
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.entity_type).toBe("page");
    expect(call_arg.entity_id).toBe("/competitions/league-1");
  });

  it("sets entity_display_name to the page_title", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_page_viewed("/teams", "Teams");
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.entity_display_name).toBe("Teams");
  });

  it("writes an empty changes array", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_page_viewed("/players", "Players");
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.changes).toEqual([]);
  });

  it("uses user_context fields when a user is set", async () => {
    initialize_audit_event_handlers();
    set_user_context({
      user_id: "u-10",
      user_email: "bob@example.com",
      user_display_name: "Bob",
      organization_id: "org-3",
    });

    EventBus.emit_page_viewed("/dashboard", "Dashboard");
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("u-10");
    expect(call_arg.user_email).toBe("bob@example.com");
    expect(call_arg.organization_id).toBe("org-3");
  });

  it("falls back to anonymous values when no user_context is set", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_page_viewed("/help", "Help");
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("anonymous");
    expect(call_arg.user_email).toBe("anonymous@unknown");
    expect(call_arg.organization_id).toBe("*");
  });
});
