import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUDIT_ACTION } from "../../core/entities/AuditLog";
import { EventBus } from "../events/EventBus";
import { AUDIT_EVENT_HANDLER_LOG_EVENT } from "./auditEventConstants";
import {
  initialize_audit_event_handlers,
  reset_audit_event_handlers,
} from "./AuditEventHandler";

const mock_create_audit_log = vi.fn();

vi.mock("../container", () => ({
  get_repository_container: vi.fn(() => ({
    audit_log_repository: { create: mock_create_audit_log },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  EventBus.clear_all_handlers();
  EventBus.enable();
  reset_audit_event_handlers();
  initialize_audit_event_handlers();
});

afterEach(() => {
  reset_audit_event_handlers();
  vi.restoreAllMocks();
});

describe("AuditEventHandler write failures", () => {
  it("logs a structured error when the audit log write fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mock_create_audit_log.mockResolvedValue({
      success: false,
      error: "Failed to create audit log",
    });

    EventBus.emit_entity_deleted("Team", "team-9", "City FC", {});
    await vi.waitFor(() => expect(error_spy).toHaveBeenCalled());

    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: AUDIT_EVENT_HANDLER_LOG_EVENT.AUDIT_LOG_WRITE_FAILED,
        entity_type: "Team",
        entity_id: "team-9",
        action: AUDIT_ACTION.DELETE,
      }),
    );
  });

  it("does not log an error when the write succeeds", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mock_create_audit_log.mockResolvedValue({ success: true, data: {} });

    EventBus.emit_entity_created("Team", "team-1", "City FC", {});
    await vi.waitFor(() => expect(mock_create_audit_log).toHaveBeenCalled());

    expect(error_spy).not.toHaveBeenCalled();
  });
});
