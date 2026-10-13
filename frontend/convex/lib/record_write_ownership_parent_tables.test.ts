import { describe, expect, it } from "vitest";

import { type CallerScope, CallerScopeKind } from "./caller_scope";
import { create_none_option, create_some_option, type Option } from "./option";
import {
  type ParentOrganizationResolution,
  ParentResolutionKind,
} from "./parent_organization_resolution";
import {
  evaluate_record_write_ownership,
  WriteOwnershipRejection,
  WriteOwnershipStatus,
} from "./record_write_ownership";
import type { WriteOwnershipDecision } from "./record_write_ownership_types";

const ORGANIZATION_A_SCOPE: CallerScope = {
  kind: CallerScopeKind.ORGANIZATION,
  organization_id: "org_a",
};
const CALLER_EMAIL = "admin.a@example.com";

function rejection_of(decision: WriteOwnershipDecision): string {
  return decision.status === WriteOwnershipStatus.REJECTED
    ? decision.rejection
    : WriteOwnershipStatus.ALLOWED;
}

describe("evaluate_record_write_ownership parent scoped tables", () => {
  const resolved = (
    organization_id: string,
  ): Option<ParentOrganizationResolution> =>
    create_some_option<ParentOrganizationResolution>({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id,
    });

  function evaluate_parent_scoped(
    incoming: ReturnType<typeof resolved>,
    existing: ReturnType<typeof resolved> | "absent",
  ): string {
    return rejection_of(
      evaluate_record_write_ownership({
        table_name: "identifications",
        caller_scope: ORGANIZATION_A_SCOPE,
        caller_email: CALLER_EMAIL,
        local_id: "identification_1",
        incoming_record: create_some_option({ holder_id: "player_1" }),
        existing_record:
          existing === "absent"
            ? create_none_option()
            : create_some_option({ holder_id: "player_0" }),
        parent_organizations: {
          incoming,
          existing:
            existing === "absent"
              ? create_none_option<ParentOrganizationResolution>()
              : existing,
        },
      }),
    );
  }

  it("allows writes whose parents belong to the caller organization", () => {
    expect(evaluate_parent_scoped(resolved("org_a"), resolved("org_a"))).toBe(
      WriteOwnershipStatus.ALLOWED,
    );
  });

  it("rejects writes whose incoming or existing parent is foreign", () => {
    expect(evaluate_parent_scoped(resolved("org_b"), "absent")).toBe(
      WriteOwnershipRejection.PARENT_FOREIGN,
    );
    expect(evaluate_parent_scoped(resolved("org_a"), resolved("org_b"))).toBe(
      WriteOwnershipRejection.PARENT_FOREIGN,
    );
  });

  it("rejects writes whose parent is shared or missing", () => {
    expect(
      evaluate_parent_scoped(
        create_some_option<ParentOrganizationResolution>({
          kind: ParentResolutionKind.PARENT_SHARED,
        }),
        "absent",
      ),
    ).toBe(WriteOwnershipRejection.PARENT_UNRESOLVED);
  });
});
