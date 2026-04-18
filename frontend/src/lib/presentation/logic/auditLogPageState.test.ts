import { describe, expect, it } from "vitest";

import type { AuditLog } from "$lib/core/entities/AuditLog";

import {
  build_audit_log_filter,
  compute_audit_log_total_pages,
  format_audit_log_changes,
  get_audit_log_action_badge_class,
  get_audit_log_organization_filter,
} from "./auditLogPageState";

function create_audit_log(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: "audit_1",
    organization_id: "org_1",
    entity_type: "team",
    entity_id: "team_1",
    entity_display_name: "Team 1",
    action: "update",
    user_id: "user_1",
    user_display_name: "User One",
    user_email: "user@example.com",
    timestamp: "2026-01-01T10:00:00Z",
    changes: [
      {
        field_name: "name",
        old_value: "Old Name",
        new_value: "New Name",
      },
    ],
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  } as AuditLog;
}

describe("auditLogPageState", () => {
  it("builds explicit organization filter state from the current profile", () => {
    expect(get_audit_log_organization_filter({ status: "missing" })).toEqual({
      status: "unfiltered",
    });

    expect(
      get_audit_log_organization_filter({
        status: "present",
        profile: { organization_id: "org_1" } as never,
      }),
    ).toEqual({
      status: "filtered",
      organization_id: "org_1",
    });
  });

  it("builds the combined audit log filter from page inputs", () => {
    const result = build_audit_log_filter({
      filter_entity_type: "fixture",
      filter_action: "create",
      filter_user: "user_2",
      organization_filter_state: {
        status: "filtered",
        organization_id: "org_1",
      },
    });

    expect(result).toEqual({
      entity_type: "fixture",
      action: "create",
      user_id: "user_2",
      organization_id: "org_1",
    });
  });

  it("omits organization_id when the organization filter state is unfiltered", () => {
    const result = build_audit_log_filter({
      filter_entity_type: "fixture",
      filter_action: "create",
      filter_user: "user_2",
      organization_filter_state: { status: "unfiltered" },
    });

    expect(result).toEqual({
      entity_type: "fixture",
      action: "create",
      user_id: "user_2",
    });
  });

  it("formats audit log changes into a readable summary", () => {
    const result = format_audit_log_changes(create_audit_log());

    expect(result).toContain('name: "Old Name"');
    expect(result).toContain('"New Name"');
  });

  it("returns an empty change summary when there are no changes", () => {
    const result = format_audit_log_changes(create_audit_log({ changes: [] }));

    expect(result).toBe("");
  });

  it("returns the expected action badge classes", () => {
    expect(get_audit_log_action_badge_class("create")).toContain("green");
    expect(get_audit_log_action_badge_class("update")).toContain("blue");
    expect(get_audit_log_action_badge_class("delete")).toContain("red");
  });

  it("computes the total page count from the total rows and page size", () => {
    expect(compute_audit_log_total_pages(0, 25)).toBe(0);
    expect(compute_audit_log_total_pages(26, 25)).toBe(2);
  });
});
