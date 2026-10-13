import { describe, expect, it } from "vitest";

import { type CallerScope, CallerScopeKind } from "./caller_scope";
import { create_none_option, create_some_option } from "./option";
import { type ParentOrganizationResolution } from "./parent_organization_resolution";
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

describe("evaluate_record_write_ownership", () => {
  it("allows global callers to write anything unchanged", () => {
    const decision = evaluate(
      "teams",
      { kind: CallerScopeKind.GLOBAL },
      { organization_id: "*" },
      { organization_id: "org_b" },
    );
    expect(decision).toEqual({
      status: WriteOwnershipStatus.ALLOWED,
      normalized_record: { organization_id: "*" },
    });
  });

  it("rejects callers without scope for organization tables", () => {
    expect(
      rejection_of(
        evaluate("teams", { kind: CallerScopeKind.NONE }, {}, "absent"),
      ),
    ).toBe(WriteOwnershipRejection.CALLER_WITHOUT_SCOPE);
  });

  it("lets callers without scope touch only their own system user record", () => {
    expect(
      rejection_of(
        evaluate(
          "system_users",
          { kind: CallerScopeKind.NONE },
          { email: CALLER_EMAIL },
          { email: CALLER_EMAIL },
        ),
      ),
    ).toBe(WriteOwnershipStatus.ALLOWED);
    expect(
      rejection_of(
        evaluate(
          "system_users",
          { kind: CallerScopeKind.NONE },
          { email: "other@example.com" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.CALLER_WITHOUT_SCOPE);
  });

  it("rejects existing records owned by another organization", () => {
    expect(
      rejection_of(
        evaluate(
          "teams",
          ORGANIZATION_A_SCOPE,
          { organization_id: "org_a" },
          { organization_id: "org_b" },
        ),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_FOREIGN);
  });

  it("rejects existing shared records for organization callers", () => {
    expect(
      rejection_of(
        evaluate(
          "system_users",
          ORGANIZATION_A_SCOPE,
          {},
          {
            organization_id: "*",
          },
        ),
      ),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_SHARED);
    expect(
      rejection_of(evaluate("teams", ORGANIZATION_A_SCOPE, {}, { name: "x" })),
    ).toBe(WriteOwnershipRejection.EXISTING_RECORD_SHARED);
  });

  it("rejects incoming records for another organization or the global scope", () => {
    expect(
      rejection_of(
        evaluate(
          "teams",
          ORGANIZATION_A_SCOPE,
          { organization_id: "org_b" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.INCOMING_RECORD_FOREIGN);
    expect(
      rejection_of(
        evaluate(
          "teams",
          ORGANIZATION_A_SCOPE,
          { organization_id: "*" },
          "absent",
        ),
      ),
    ).toBe(WriteOwnershipRejection.INCOMING_RECORD_GLOBAL);
  });
});
