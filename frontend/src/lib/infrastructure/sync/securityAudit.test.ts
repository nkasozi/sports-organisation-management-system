import { describe, expect, it } from "vitest";

import { SecurityEventType } from "../../../../convex/lib/security_event_types";

describe("SecurityEventType constants", () => {
  it("defines all required security event types", () => {
    expect(SecurityEventType.AUTH_FAILURE).toBe("auth_failure");
    expect(SecurityEventType.ACCESS_DENIED).toBe("access_denied");
    expect(SecurityEventType.ROLE_ESCALATION_BLOCKED).toBe(
      "role_escalation_blocked",
    );
    expect(SecurityEventType.INVALID_TABLE_ACCESS).toBe("invalid_table_access");
    expect(SecurityEventType.ORG_SCOPE_VIOLATION).toBe("org_scope_violation");
    expect(SecurityEventType.SYNC_MUTATION).toBe("sync_mutation");
    expect(SecurityEventType.SEED_ADMIN_BLOCKED).toBe("seed_admin_blocked");
  });

  it("contains exactly 7 event types", () => {
    const event_type_count = Object.keys(SecurityEventType).length;
    expect(event_type_count).toBe(7);
  });

  it("has unique values for all event types", () => {
    const values = Object.values(SecurityEventType);
    const unique_values = new Set(values);
    expect(unique_values.size).toBe(values.length);
  });
});
