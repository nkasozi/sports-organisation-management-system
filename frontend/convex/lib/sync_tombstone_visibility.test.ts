import { describe, expect, it } from "vitest";

import type { SystemUserRecord } from "./auth_middleware";
import {
  build_visibility_scope_fields,
  ParentOrganizationSnapshotKind,
  type StoredTombstoneScope,
  TombstoneVisibilityKind,
} from "./sync_tombstone_scope";
import { is_stored_visibility_visible } from "./sync_tombstone_visibility";

function caller(fields: Record<string, unknown>): SystemUserRecord {
  return {
    _id: "user",
    local_id: "user",
    email: "caller@example.com",
    role: "org_admin",
    status: "active",
    ...fields,
  } as unknown as SystemUserRecord;
}

const GLOBAL_CALLER = caller({ role: "super_admin", organization_id: "*" });
const ORGANIZATION_A_CALLER = caller({ organization_id: "org_a" });
const ORGANIZATION_B_CALLER = caller({ organization_id: "org_b" });
const UNSCOPED_CALLER = caller({ email: "nobody@example.com" });

function organization_scope(organization_id: string): StoredTombstoneScope {
  return {
    fields: { local_id: "team_x", organization_id },
    parent_organization: {
      kind: ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED,
    },
  };
}

function parent_scope(
  parent_organization: StoredTombstoneScope["parent_organization"],
): StoredTombstoneScope {
  return { fields: { local_id: "stage_a" }, parent_organization };
}

describe("is_stored_visibility_visible", () => {
  it("shows a no-organization user the tombstone of their own system user", () => {
    const scope = {
      fields: build_visibility_scope_fields("system_users", {
        local_id: "user_old",
        email: "nobody@example.com",
      }),
      parent_organization: {
        kind: ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED,
      },
    };
    const deleted = { kind: TombstoneVisibilityKind.DELETED, scope };
    expect(scope.fields.email).toBe("nobody@example.com");
    expect(
      is_stored_visibility_visible(UNSCOPED_CALLER, "system_users", deleted),
    ).toBe(true);
    expect(
      is_stored_visibility_visible(
        caller({ email: "other@example.com" }),
        "system_users",
        deleted,
      ),
    ).toBe(false);
  });

  it("matches parent scoped tombstones against the stored organization", () => {
    const deleted = {
      kind: TombstoneVisibilityKind.DELETED,
      scope: parent_scope({
        kind: ParentOrganizationSnapshotKind.RESOLVED,
        organization_id: "org_a",
      }),
    };
    expect(
      [
        GLOBAL_CALLER,
        ORGANIZATION_A_CALLER,
        ORGANIZATION_B_CALLER,
        UNSCOPED_CALLER,
      ].map((user) =>
        is_stored_visibility_visible(user, "competition_stages", deleted),
      ),
    ).toEqual([true, true, false, false]);
  });

  it("only shows unresolved parent scoped tombstones to global callers", () => {
    const deleted = {
      kind: TombstoneVisibilityKind.DELETED,
      scope: parent_scope({ kind: ParentOrganizationSnapshotKind.UNRESOLVED }),
    };
    expect(
      [GLOBAL_CALLER, ORGANIZATION_A_CALLER].map((user) =>
        is_stored_visibility_visible(user, "competition_stages", deleted),
      ),
    ).toEqual([true, false]);
  });

  it("shows scope exits only to callers who saw the old scope but not the new one", () => {
    const scope_exit = {
      kind: TombstoneVisibilityKind.SCOPE_EXIT,
      previous_scope: organization_scope("org_a"),
      current_scope: organization_scope("org_b"),
    };
    expect(
      [GLOBAL_CALLER, ORGANIZATION_A_CALLER, ORGANIZATION_B_CALLER].map(
        (user) => is_stored_visibility_visible(user, "teams", scope_exit),
      ),
    ).toEqual([false, true, false]);
  });
});
