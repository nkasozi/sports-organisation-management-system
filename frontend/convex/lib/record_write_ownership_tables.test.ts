import { describe, expect, it } from "vitest";

import { type CallerScope, CallerScopeKind } from "./caller_scope";
import { create_none_option, create_some_option } from "./option";
import type { ParentOrganizationResolution } from "./parent_organization_resolution";
import {
  evaluate_record_write_ownership,
  WriteOwnershipRejection,
  WriteOwnershipStatus,
} from "./record_write_ownership";
import type { AllowedSyncTable } from "./sync_validation";

const ORGANIZATION_A_SCOPE: CallerScope = {
  kind: CallerScopeKind.ORGANIZATION,
  organization_id: "org_a",
};
const CALLER_EMAIL = "admin.a@example.com";
const NO_PARENT_ORGANIZATIONS = {
  existing: create_none_option<ParentOrganizationResolution>(),
  incoming: create_none_option<ParentOrganizationResolution>(),
};

function evaluate(
  table_name: AllowedSyncTable,
  caller_scope: CallerScope,
  incoming: Record<string, unknown> | "absent",
  existing: Record<string, unknown> | "absent",
): ReturnType<typeof evaluate_record_write_ownership> {
  return evaluate_record_write_ownership({
    table_name,
    caller_scope,
    caller_email: CALLER_EMAIL,
    local_id: "record_1",
    incoming_record:
      incoming === "absent"
        ? create_none_option()
        : create_some_option(incoming),
    existing_record:
      existing === "absent"
        ? create_none_option()
        : create_some_option(existing),
    parent_organizations: NO_PARENT_ORGANIZATIONS,
  });
}

function rejection_of(decision: ReturnType<typeof evaluate>): string {
  return decision.status === WriteOwnershipStatus.REJECTED
    ? decision.rejection
    : WriteOwnershipStatus.ALLOWED;
}

describe("evaluate_record_write_ownership table strategies", () => {
  it("stamps the caller organization on unscoped incoming records", () => {
    expect(
      evaluate(
        "teams",
        ORGANIZATION_A_SCOPE,
        { organization_id: "" },
        "absent",
      ),
    ).toEqual({
      status: WriteOwnershipStatus.ALLOWED,
      normalized_record: { organization_id: "org_a" },
    });
  });

  it("allows deletes of owned records", () => {
    expect(
      evaluate("teams", ORGANIZATION_A_SCOPE, "absent", {
        organization_id: "org_a",
      }),
    ).toEqual({ status: WriteOwnershipStatus.ALLOWED, normalized_record: {} });
  });

  it("rejects writes to organizations other than the caller's own", () => {
    expect(
      rejection_of(
        evaluate("organizations", ORGANIZATION_A_SCOPE, {}, "absent"),
      ),
    ).toBe(WriteOwnershipRejection.ORGANIZATION_IDENTITY_FOREIGN);
  });

  it("rejects organization callers modifying global shared reference rows", () => {
    expect(
      rejection_of(
        evaluate(
          "sports",
          ORGANIZATION_A_SCOPE,
          { name: "Hockey" },
          { organization_id: "*" },
        ),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_SHARED);
  });

  it("rejects organization callers deleting global or unscoped shared reference rows", () => {
    expect(
      rejection_of(
        evaluate("genders", ORGANIZATION_A_SCOPE, "absent", {
          organization_id: "*",
        }),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_SHARED);
    expect(
      rejection_of(
        evaluate("jersey_colors", ORGANIZATION_A_SCOPE, "absent", {
          organization_id: "",
        }),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_SHARED);
  });

  it("rejects shared reference rows owned by a foreign organization", () => {
    expect(
      rejection_of(
        evaluate(
          "player_positions",
          ORGANIZATION_A_SCOPE,
          {},
          { organization_id: "org_b" },
        ),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_FOREIGN);
  });

  it("rejects incoming shared reference rows stamped global or foreign", () => {
    expect(
      rejection_of(
        evaluate(
          "game_event_types",
          ORGANIZATION_A_SCOPE,
          { organization_id: "*" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.INCOMING_RECORD_GLOBAL);
    expect(
      rejection_of(
        evaluate(
          "activity_categories",
          ORGANIZATION_A_SCOPE,
          { organization_id: "org_b" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.INCOMING_RECORD_FOREIGN);
  });

  it("stamps the caller organization on unscoped incoming shared reference rows", () => {
    expect(
      evaluate(
        "identification_types",
        ORGANIZATION_A_SCOPE,
        { name: "Passport" },
        { organization_id: "org_a" },
      ),
    ).toEqual({
      status: WriteOwnershipStatus.ALLOWED,
      normalized_record: { name: "Passport", organization_id: "org_a" },
    });
  });

  it("allows global callers to modify global shared reference rows", () => {
    expect(
      rejection_of(
        evaluate(
          "sports",
          { kind: CallerScopeKind.GLOBAL },
          { name: "Hockey", organization_id: "*" },
          { organization_id: "*" },
        ),
      ),
    ).toBe(WriteOwnershipStatus.ALLOWED);
  });

  it("denies parent scoped writes whose parent cannot be resolved", () => {
    expect(
      rejection_of(
        evaluate(
          "competition_stages",
          ORGANIZATION_A_SCOPE,
          { name: "x" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.PARENT_UNRESOLVED);
  });
});
