import { describe, expect, it } from "vitest";

import { to_auditable_entity_id } from "./audit_entity_masking";

const SYSTEM_USER_ENTITY = "systemuser";
const EMAIL_LOCAL_ID = "super_admin_root@example.com";
const SANITIZED_EMAIL_LOCAL_ID = "admin_seed_root_example_com";

describe("to_auditable_entity_id", () => {
  it("replaces system user identifiers with an opaque stable reference", () => {
    const masked = to_auditable_entity_id(SYSTEM_USER_ENTITY, EMAIL_LOCAL_ID);
    expect(masked).not.toContain("root");
    expect(masked).not.toContain("example");
    expect(masked).toMatch(/^systemuser_ref_[0-9a-f]{8}$/);
    expect(to_auditable_entity_id(SYSTEM_USER_ENTITY, EMAIL_LOCAL_ID)).toBe(
      masked,
    );
    expect(
      to_auditable_entity_id(SYSTEM_USER_ENTITY, SANITIZED_EMAIL_LOCAL_ID),
    ).not.toBe(masked);
  });

  it("is idempotent for already masked identifiers", () => {
    const masked = to_auditable_entity_id(SYSTEM_USER_ENTITY, EMAIL_LOCAL_ID);
    expect(to_auditable_entity_id(SYSTEM_USER_ENTITY, masked)).toBe(masked);
  });

  it("keeps empty identifiers and other entity types unchanged", () => {
    expect(to_auditable_entity_id(SYSTEM_USER_ENTITY, "")).toBe("");
    expect(to_auditable_entity_id("team", "team_1")).toBe("team_1");
  });
});
