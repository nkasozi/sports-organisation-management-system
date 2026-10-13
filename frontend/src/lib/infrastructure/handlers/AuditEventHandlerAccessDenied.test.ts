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

describe("handle_access_denied", () => {
  it("writes an audit log with action 'access_denied'", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "Player",
      "player-99",
      "read",
      "player_data",
      "insufficient_permissions",
      "public_viewer",
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
      "team_manager",
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
      "org_admin",
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
      "org_admin",
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
      "public_viewer",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.user_id).toBe("anonymous");
    expect(call_arg.user_email).toBe("anonymous@unknown");
    expect(call_arg.organization_id).toBe("*");
  });
});

describe("handle_access_denied — additional coverage", () => {
  it("prefixes entity_display_name with 'Access Denied: '", async () => {
    initialize_audit_event_handlers();

    EventBus.emit_access_denied(
      "MatchReport",
      "report-1",
      "view",
      "report_data",
      "insufficient_permissions",
      "player",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    expect(call_arg.entity_display_name).toBe("Access Denied: MatchReport");
  });

  it("records the user role in the role change field value", async () => {
    initialize_audit_event_handlers();
    set_user_context({
      user_id: "u-1",
      user_email: "e@e.com",
      user_display_name: "E",
      organization_id: "org-1",
    });

    EventBus.emit_access_denied(
      "Team",
      "team-1",
      "delete",
      "team_data",
      "role_too_low",
      "team_manager",
    );
    await Promise.resolve();

    const call_arg = mock_create_audit_log.mock.calls[0][0];
    const role_change = call_arg.changes.find(
      (c: { field_name: string }) => c.field_name === "role",
    );
    expect(role_change?.new_value).toBe("team_manager");
  });
});
