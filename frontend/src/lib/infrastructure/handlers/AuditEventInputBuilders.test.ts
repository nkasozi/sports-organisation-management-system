import { describe, expect, it } from "vitest";

import {
  apply_anonymous_user_identity,
  build_access_denied_details,
  build_base_audit_input,
  build_field_changes,
} from "./AuditEventInputBuilders";

const DENIED_PAYLOAD = {
  entity_type: "team",
  entity_id: "t1",
  attempted_action: "delete",
  data_category: "teams",
  denial_reason: "no permission",
} as never;

describe("AuditEventInputBuilders", () => {
  it("defaults to the system identity without user context", () => {
    expect(
      build_base_audit_input("team", "t1", "Team", "create", []),
    ).toMatchObject({
      user_id: "system",
      user_email: "system@sport-sync.local",
      user_display_name: "System",
      organization_id: "*",
      ip_address: "127.0.0.1",
      user_agent: "SportSyncApp/1.0",
    });
  });

  it("stringifies changed fields with empty fallbacks", () => {
    expect(build_field_changes({ a: 1 }, { b: true }, ["a", "b"])).toEqual([
      { field_name: "a", old_value: "1", new_value: "" },
      { field_name: "b", old_value: "", new_value: "true" },
    ]);
  });

  it("builds access denial details with optional context", () => {
    const without_context = build_access_denied_details(DENIED_PAYLOAD);
    const with_context = build_access_denied_details({
      ...(DENIED_PAYLOAD as object),
      context: "settings page",
      user_context: { role: "player" },
    } as never);

    expect(without_context.map((d) => d.new_value)).toEqual([
      "delete",
      "teams",
      "no permission",
      "unknown",
    ]);
    expect(with_context.slice(3)).toEqual([
      { field_name: "role", old_value: "", new_value: "player" },
      { field_name: "context", old_value: "", new_value: "settings page" },
    ]);
  });

  it("applies anonymous identity defaults while keeping known values", () => {
    const base = build_base_audit_input("page", "/", "Home", "page_view", []);

    expect(apply_anonymous_user_identity(base)).toMatchObject({
      user_id: "anonymous",
      user_email: "anonymous@unknown",
      user_display_name: "Anonymous",
    });
    expect(
      apply_anonymous_user_identity(base, { user_id: "u1" } as never).user_id,
    ).toBe("u1");
  });
});
