import { describe, expect, it } from "vitest";

import { SecurityEventType } from "./security_event_types";

describe("security_event_types", () => {
  it("exposes the canonical security audit event names", () => {
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
});
