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

const GLOBAL_ORG_ADMIN: SystemUserSnapshot = {
  email: "global.admin@example.com",
  role: "org_admin",
  organization_id: "*",
  status: "active",
};
const SUPER_ADMIN: SystemUserSnapshot = {
  email: "root@example.com",
  role: "super_admin",
  organization_id: "*",
  status: "active",
};
const OTHER_SUPER_ADMIN: SystemUserSnapshot = {
  ...SUPER_ADMIN,
  email: "root.two@example.com",
};
const PEER_ORG_ADMIN: SystemUserSnapshot = {
  email: "peer.admin@example.com",
  role: "org_admin",
  organization_id: "org_a",
  status: "active",
};
const PLAYER: SystemUserSnapshot = {
  email: "player.a@example.com",
  role: "player",
  organization_id: "org_a",
  status: "active",
};
const GLOBAL_SCOPE: CallerScope = { kind: CallerScopeKind.GLOBAL };

function decide(caller: SystemUserSnapshot, change: SystemUserChange): string {
  const decision = evaluate_system_user_change({
    caller,
    caller_scope: GLOBAL_SCOPE,
    change,
    active_super_admin_count: 3,
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

function remove(current: SystemUserSnapshot): SystemUserChange {
  return { kind: SystemUserChangeKind.DELETE, current };
}

describe("role hierarchy applies regardless of a global caller scope", () => {
  it("rejects a global-scope org admin modifying a super admin", () => {
    expect(
      decide(GLOBAL_ORG_ADMIN, update(SUPER_ADMIN, { status: "inactive" })),
    ).toBe(SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER);
    expect(
      decide(
        GLOBAL_ORG_ADMIN,
        update(SUPER_ADMIN, { email: "hijacked@example.com" }),
      ),
    ).toBe(SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER);
  });

  it("rejects a global-scope org admin removing a super admin", () => {
    expect(decide(GLOBAL_ORG_ADMIN, remove(SUPER_ADMIN))).toBe(
      SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER,
    );
  });

  it("rejects a global-scope org admin managing a peer org admin", () => {
    expect(
      decide(GLOBAL_ORG_ADMIN, update(PEER_ORG_ADMIN, { status: "inactive" })),
    ).toBe(SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER);
    expect(decide(GLOBAL_ORG_ADMIN, remove(PEER_ORG_ADMIN))).toBe(
      SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER,
    );
  });

  it("still lets a global-scope org admin manage lower roles", () => {
    expect(
      decide(GLOBAL_ORG_ADMIN, update(PLAYER, { status: "inactive" })),
    ).toBe(SystemUserChangeStatus.ALLOWED);
    expect(decide(GLOBAL_ORG_ADMIN, remove(PLAYER))).toBe(
      SystemUserChangeStatus.ALLOWED,
    );
  });

  it("lets a super admin manage and remove another super admin", () => {
    expect(
      decide(SUPER_ADMIN, update(OTHER_SUPER_ADMIN, { status: "inactive" })),
    ).toBe(SystemUserChangeStatus.ALLOWED);
    expect(decide(SUPER_ADMIN, remove(OTHER_SUPER_ADMIN))).toBe(
      SystemUserChangeStatus.ALLOWED,
    );
  });
});
