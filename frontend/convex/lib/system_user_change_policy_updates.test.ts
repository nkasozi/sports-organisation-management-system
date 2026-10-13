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

function update(
  current: SystemUserSnapshot,
  overrides: Partial<SystemUserSnapshot>,
): SystemUserChange {
  return {
    kind: SystemUserChangeKind.UPDATE,
    current,
    requested: { ...current, ...overrides },
  };
}

describe("evaluate_system_user_change for updates", () => {
  it("allows self updates that keep privileges unchanged", () => {
    expect(decide(PLAYER, ORGANIZATION_A_SCOPE, update(PLAYER, {}))).toBe(
      SystemUserChangeStatus.ALLOWED,
    );
  });

  it("rejects self privilege changes", () => {
    expect(
      decide(
        PLAYER,
        ORGANIZATION_A_SCOPE,
        update(PLAYER, { role: "org_admin" }),
      ),
    ).toBe(SystemUserChangeRejection.SELF_PRIVILEGE_CHANGE);
    expect(
      decide(
        SUPER_ADMIN,
        GLOBAL_SCOPE,
        update(SUPER_ADMIN, { role: "player" }),
        3,
      ),
    ).toBe(SystemUserChangeRejection.SELF_PRIVILEGE_CHANGE);
  });

  it("rejects managing users at or above the caller level", () => {
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        update(SUPER_ADMIN, { role: "player" }),
      ),
    ).toBe(SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER);
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        update(
          { ...ORG_ADMIN, email: "peer@example.com" },
          { status: "inactive" },
        ),
      ),
    ).toBe(SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER);
  });

  it("rejects promotions to the caller level and moves outside scope", () => {
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        update(PLAYER, { role: "org_admin" }),
      ),
    ).toBe(SystemUserChangeRejection.ROLE_NOT_ASSIGNABLE);
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        update(PLAYER, { organization_id: "org_b" }),
      ),
    ).toBe(SystemUserChangeRejection.ORGANIZATION_OUTSIDE_SCOPE);
    expect(
      decide(
        ORG_ADMIN,
        ORGANIZATION_A_SCOPE,
        update(PLAYER, { email: "x@example.com" }),
      ),
    ).toBe(SystemUserChangeRejection.IDENTITY_CHANGE);
  });

  it("protects the last active super admin", () => {
    const other_super_admin = { ...SUPER_ADMIN, email: "root.two@example.com" };
    expect(
      decide(
        SUPER_ADMIN,
        GLOBAL_SCOPE,
        update(other_super_admin, { role: "player", organization_id: "org_a" }),
        1,
      ),
    ).toBe(SystemUserChangeRejection.LAST_SUPER_ADMIN);
    expect(
      decide(
        SUPER_ADMIN,
        GLOBAL_SCOPE,
        update(other_super_admin, {
          role: "org_admin",
          organization_id: "org_a",
        }),
        2,
      ),
    ).toBe(SystemUserChangeStatus.ALLOWED);
  });
});

describe("evaluate_system_user_change for deletes", () => {
  it("allows deleting lower users and rejects self or higher targets", () => {
    const remove = (current: SystemUserSnapshot): SystemUserChange => ({
      kind: SystemUserChangeKind.DELETE,
      current,
    });
    expect(decide(ORG_ADMIN, ORGANIZATION_A_SCOPE, remove(PLAYER))).toBe(
      SystemUserChangeStatus.ALLOWED,
    );
    expect(decide(ORG_ADMIN, ORGANIZATION_A_SCOPE, remove(ORG_ADMIN))).toBe(
      SystemUserChangeRejection.SELF_PRIVILEGE_CHANGE,
    );
    expect(decide(ORG_ADMIN, ORGANIZATION_A_SCOPE, remove(SUPER_ADMIN))).toBe(
      SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER,
    );
  });
});
