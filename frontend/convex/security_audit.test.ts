import { describe, expect, it } from "vitest";

import { update_user_role } from "./authorization_mutations";
import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { log_security_event } from "./security_audit";

const EMAIL_LOCAL_ID = "super_admin_root@example.com";

describe("log_security_event", () => {
  it("never persists system user identifiers that embed an email", async () => {
    const context = create_fake_convex_context({
      identity: ANONYMOUS_IDENTITY,
      tables: {},
    });
    await invoke_convex_handler(log_security_event, context, {
      event_type: "role_escalation_blocked",
      entity_type: "systemuser",
      entity_id: EMAIL_LOCAL_ID,
    });
    const [audit_row] = find_table_rows(context, "audit_logs");
    expect(String(audit_row.entity_id)).not.toContain("root");
    expect(String(audit_row.entity_id)).toMatch(/^systemuser_ref_/);
  });

  it("keeps identifiers of other entity types for investigation", async () => {
    const context = create_fake_convex_context({
      identity: ANONYMOUS_IDENTITY,
      tables: {},
    });
    await invoke_convex_handler(log_security_event, context, {
      event_type: "access_denied",
      entity_type: "team",
      entity_id: "team_1",
    });
    expect(find_table_rows(context, "audit_logs")[0].entity_id).toBe("team_1");
  });
});

describe("scheduled security audits", () => {
  it("mask system user identifiers before scheduling", async () => {
    const context = create_fake_convex_context({
      identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      tables: { system_users: ALL_FIXTURE_USERS },
    });
    await invoke_convex_handler(update_user_role, context, {
      target_email: SUPER_ADMIN_EMAIL,
      role: "player",
    });
    const [scheduled_call] = context.scheduled_calls;
    expect(String(scheduled_call.function_arguments.entity_id)).toMatch(
      /^systemuser_ref_[0-9a-f]{8}$/,
    );
  });
});
