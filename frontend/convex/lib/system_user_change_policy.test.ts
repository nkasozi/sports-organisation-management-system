import { describe, expect, it } from "vitest";

import { type CallerScope, CallerScopeKind } from "./caller_scope";
import {
  evaluate_system_user_change,
  type SystemUserChange,
  SystemUserChangeKind,
  SystemUserChangeRejection,
  SystemUserChangeStatus,
  type SystemUserSnapshot,
} from "./system_user_change_policy";

const ORG_ADMIN: SystemUserSnapshot = {
  email: "admin.a@example.com",
  role: "org_admin",
  organization_id: "org_a",
  status: "active",
};
const SUPER_ADMIN: SystemUserSnapshot = {
  email: "root@example.com",
  role: "super_admin",
  organization_id: "*",
  status: "active",
};
const PLAYER: SystemUserSnapshot = {
  email: "player.a@example.com",
  role: "player",
  organization_id: "org_a",
  status: "active",
};
const ORGANIZATION_A_SCOPE: CallerScope = {
  kind: CallerScopeKind.ORGANIZATION,
  organization_id: "org_a",
};
const GLOBAL_SCOPE: CallerScope = { kind: CallerScopeKind.GLOBAL };

function decide(
  caller: SystemUserSnapshot,
  caller_scope: CallerScope,
  change: SystemUserChange,
  active_super_admin_count = 1,
): string {
  const decision = evaluate_system_user_change({
    caller,
    caller_scope,
    change,
    active_super_admin_count,
  });
  return decision.status === SystemUserChangeStatus.REJECTED
    ? decision.rejection
    : SystemUserChangeStatus.ALLOWED;
}

describe("evaluate_system_user_change for creates", () => {
  it("allows creating a lower role inside the caller organization", () => {
    expect(
      decide(ORG_ADMIN, ORGANIZATION_A_SCOPE, {
        kind: SystemUserChangeKind.CREATE,
        requested: { ...PLAYER, role: "team_manager" },
        email_already_registered: false,
      }),
    ).toBe(SystemUserChangeStatus.ALLOWED);
  });

  it("rejects peer roles, duplicate emails, global scope and foreign orgs", () => {
    const create = (
      requested: SystemUserSnapshot,
      email_already_registered = false,
    ): SystemUserChange => ({
      kind: SystemUserChangeKind.CREATE,
      requested,
      email_already_registered,
    });
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        create({ ...PLAYER, role: "org_admin" }),
      ),
    ).toBe(SystemUserChangeRejection.ROLE_NOT_ASSIGNABLE);
    expect(decide(ORG_ADMIN, ORGANIZATION_A_SCOPE, create(PLAYER, true))).toBe(
      SystemUserChangeRejection.DUPLICATE_EMAIL,
    );
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        create({ ...PLAYER, organization_id: "*" }),
      ),
    ).toBe(SystemUserChangeRejection.GLOBAL_SCOPE_RESERVED);
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        create({ ...PLAYER, organization_id: "org_b" }),
      ),
    ).toBe(SystemUserChangeRejection.ORGANIZATION_OUTSIDE_SCOPE);
  });

  it("reserves the global scope and super admin role for the seed path", () => {
    expect(
      decide(SUPER_ADMIN, GLOBAL_SCOPE, {
        kind: SystemUserChangeKind.CREATE,
        requested: { ...PLAYER, organization_id: "*" },
        email_already_registered: false,
      }),
    ).toBe(SystemUserChangeRejection.GLOBAL_SCOPE_RESERVED);
    expect(
      decide(SUPER_ADMIN, GLOBAL_SCOPE, {
        kind: SystemUserChangeKind.CREATE,
        requested: { ...SUPER_ADMIN, email: "new.root@example.com" },
        email_already_registered: false,
      }),
    ).toBe(SystemUserChangeRejection.ROLE_NOT_ASSIGNABLE);
  });
});
