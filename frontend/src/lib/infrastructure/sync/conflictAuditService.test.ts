import { describe, expect, it } from "vitest";

import {
  format_table_name_for_display,
  format_value_for_audit,
  get_resolution_description,
} from "./conflictAuditService.test_support";

describe("format_value_for_audit", () => {
  it("formats missing values as string null", () => {
    expect(format_value_for_audit(JSON.parse("null"))).toBe("null");
  });

  it("formats undefined as string undefined", () => {
    expect(format_value_for_audit(void 0)).toBe("undefined");
  });

  it("formats objects as JSON strings", () => {
    const result = format_value_for_audit({ name: "test", count: 5 });
    expect(result).toBe('{"name":"test","count":5}');
  });

  it("formats arrays as JSON strings", () => {
    const result = format_value_for_audit(["a", "b", "c"]);
    expect(result).toBe('["a","b","c"]');
  });

  it("formats strings as-is", () => {
    expect(format_value_for_audit("hello")).toBe("hello");
  });

  it("formats numbers as strings", () => {
    expect(format_value_for_audit(42)).toBe("42");
    expect(format_value_for_audit(3.14)).toBe("3.14");
  });

  it("formats booleans as strings", () => {
    expect(format_value_for_audit(true)).toBe("true");
    expect(format_value_for_audit(false)).toBe("false");
  });

  it("formats empty object", () => {
    expect(format_value_for_audit({})).toBe("{}");
  });

  it("formats empty array", () => {
    expect(format_value_for_audit([])).toBe("[]");
  });

  it("formats nested objects", () => {
    const result = format_value_for_audit({
      outer: { inner: "value" },
    });
    expect(result).toBe('{"outer":{"inner":"value"}}');
  });
});

describe("format_table_name_for_display", () => {
  it("converts snake_case to Title Case", () => {
    expect(format_table_name_for_display("team_staff_roles")).toBe(
      "Team Staff Roles",
    );
  });

  it("handles single word table names", () => {
    expect(format_table_name_for_display("teams")).toBe("Teams");
  });

  it("handles multiple underscores", () => {
    expect(format_table_name_for_display("player_team_memberships")).toBe(
      "Player Team Memberships",
    );
  });

  it("handles table names without underscores", () => {
    expect(format_table_name_for_display("organizations")).toBe(
      "Organizations",
    );
  });
});

describe("get_resolution_description", () => {
  it("returns correct description for keep_local", () => {
    expect(get_resolution_description("keep_local")).toBe(
      "Kept local changes (overwrote server)",
    );
  });

  it("returns correct description for keep_remote", () => {
    expect(get_resolution_description("keep_remote")).toBe(
      "Kept server version (discarded local)",
    );
  });

  it("returns correct description for merge", () => {
    expect(get_resolution_description("merge")).toBe(
      "Manual merge of local and remote changes",
    );
  });
});
