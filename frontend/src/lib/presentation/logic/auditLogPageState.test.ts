import { describe, expect, it } from "vitest";

import type { AuditLog } from "$lib/core/entities/AuditLog";

import {
  build_audit_log_filter,
  compute_audit_log_total_pages,
  format_audit_log_change_lines,
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

  it("describes each updated field from its old value to its new value", () => {
    const result = format_audit_log_change_lines(create_audit_log());

    expect(result).toEqual(["name: Old Name → New Name"]);
  });

  it("lists the values of a created record", () => {
    const result = format_audit_log_change_lines(
      create_audit_log({
        action: "create",
        changes: [{ field_name: "Name", old_value: "", new_value: "Lions" }],
      }),
    );

    expect(result).toEqual(["Name: Lions"]);
  });

  it("lists the values a deleted record had", () => {
    const result = format_audit_log_change_lines(
      create_audit_log({
        action: "delete",
        changes: [{ field_name: "Name", old_value: "Lions", new_value: "" }],
      }),
    );

    expect(result).toEqual(["Name: Lions"]);
  });

  it("shows added and removed list items with their value", () => {
    const result = format_audit_log_change_lines(
      create_audit_log({
        changes: [
          {
            field_name: "Game events: added",
            old_value: "",
            new_value: "Goal 3'",
          },
          {
            field_name: "Game events: removed",
            old_value: "Card 9'",
            new_value: "",
          },
        ],
      }),
    );

    expect(result).toEqual([
      "Game events: added: Goal 3'",
      "Game events: removed: Card 9'",
    ]);
  });

  it("returns no change lines when there are no changes", () => {
    const result = format_audit_log_change_lines(
      create_audit_log({ changes: [] }),
    );

    expect(result).toEqual([]);
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
