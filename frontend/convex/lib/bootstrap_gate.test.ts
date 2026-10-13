import { describe, expect, it } from "vitest";

import {
  type BootstrapAllowlist,
  BootstrapAllowlistKind,
  parse_bootstrap_allowlist,
} from "./bootstrap_allowlist";
import {
  BootstrapPhase,
  decide_super_admin_seed,
  resolve_bootstrap_state,
  type SeedCaller,
  SeedCallerKind,
  SeedDecisionStatus,
  SeedRejection,
  type SystemUserCensus,
} from "./bootstrap_gate";

const STRANGER: SeedCaller = {
  kind: SeedCallerKind.UNREGISTERED,
  email: "stranger@example.com",
  email_verified: true,
};
const STRANGER_ALLOWLIST: BootstrapAllowlist = {
  kind: BootstrapAllowlistKind.CONFIGURED,
  emails: ["stranger@example.com"],
};
const SUPER_ADMIN: SeedCaller = {
  kind: SeedCallerKind.REGISTERED,
  email: "root@example.com",
  role: "super_admin",
  organization_id: "*",
  status: "active",
};
const GLOBAL_ORG_ADMIN: SeedCaller = {
  ...SUPER_ADMIN,
  email: "rogue@example.com",
  role: "org_admin",
};

const EMPTY_SYSTEM = {
  has_registered_users: false,
  active_super_admin_count: 0,
};
const ORPHANED_SYSTEM = {
  has_registered_users: true,
  active_super_admin_count: 0,
};

function established_system(
  active_super_admin_count: number,
): SystemUserCensus {
  return { has_registered_users: true, active_super_admin_count };
}

function decide(
  census: { has_registered_users: boolean; active_super_admin_count: number },
  caller: SeedCaller,
  target_email: string,
  bootstrap_allowlist: BootstrapAllowlist = STRANGER_ALLOWLIST,
): string {
  const decision = decide_super_admin_seed({
    bootstrap: resolve_bootstrap_state(census),
    caller,
    target_email,
    bootstrap_allowlist,
  });
  return decision.status === SeedDecisionStatus.REJECTED
    ? decision.rejection
    : SeedDecisionStatus.ALLOWED;
}

describe("resolve_bootstrap_state", () => {
  it("is awaiting the first super admin only when no system users exist", () => {
    expect(resolve_bootstrap_state(EMPTY_SYSTEM)).toEqual({
      phase: BootstrapPhase.AWAITING_FIRST_SUPER_ADMIN,
    });
    expect(resolve_bootstrap_state(established_system(2))).toEqual({
      phase: BootstrapPhase.ESTABLISHED,
      active_super_admin_count: 2,
    });
  });

  it("is orphaned when users exist but none is an active super admin", () => {
    expect(resolve_bootstrap_state(ORPHANED_SYSTEM)).toEqual({
      phase: BootstrapPhase.ORPHANED_WITHOUT_SUPER_ADMIN,
    });
  });
});

describe("decide_super_admin_seed", () => {
  it("never allows anonymous callers", () => {
    expect(
      decide(EMPTY_SYSTEM, { kind: SeedCallerKind.ANONYMOUS }, "x@example.com"),
    ).toBe(SeedRejection.ANONYMOUS_CALLER);
  });

  it("lets an authenticated caller claim only their own email during bootstrap", () => {
    expect(decide(EMPTY_SYSTEM, STRANGER, STRANGER.email)).toBe(
      SeedDecisionStatus.ALLOWED,
    );
    expect(decide(EMPTY_SYSTEM, STRANGER, "victim@example.com")).toBe(
      SeedRejection.BOOTSTRAP_TARGET_NOT_CALLER,
    );
  });

  it("requires an active super admin once established", () => {
    expect(decide(established_system(1), SUPER_ADMIN, "new@example.com")).toBe(
      SeedDecisionStatus.ALLOWED,
    );
    expect(decide(established_system(1), STRANGER, STRANGER.email)).toBe(
      SeedRejection.CALLER_NOT_SUPER_ADMIN,
    );
    expect(
      decide(established_system(1), GLOBAL_ORG_ADMIN, GLOBAL_ORG_ADMIN.email),
    ).toBe(SeedRejection.CALLER_NOT_SUPER_ADMIN);
    expect(
      decide(
        established_system(1),
        { ...SUPER_ADMIN, status: "inactive" },
        "new@example.com",
      ),
    ).toBe(SeedRejection.CALLER_NOT_SUPER_ADMIN);
  });

  it("rejects every claim when users exist without an active super admin", () => {
    expect(decide(ORPHANED_SYSTEM, STRANGER, STRANGER.email)).toBe(
      SeedRejection.NO_ACTIVE_SUPER_ADMIN,
    );
    expect(
      decide(ORPHANED_SYSTEM, GLOBAL_ORG_ADMIN, GLOBAL_ORG_ADMIN.email),
    ).toBe(SeedRejection.NO_ACTIVE_SUPER_ADMIN);
    expect(
      decide(
        ORPHANED_SYSTEM,
        { ...SUPER_ADMIN, status: "inactive" },
        SUPER_ADMIN.email,
      ),
    ).toBe(SeedRejection.NO_ACTIVE_SUPER_ADMIN);
  });

  it("rejects registered callers during bootstrap", () => {
    expect(decide(EMPTY_SYSTEM, SUPER_ADMIN, SUPER_ADMIN.email)).toBe(
      SeedRejection.BOOTSTRAP_CALLER_REGISTERED,
    );
  });
});

describe("bootstrap allowlist", () => {
  it("parses a comma separated, case-insensitive allowlist", () => {
    expect(
      parse_bootstrap_allowlist(" Root@Example.com, ,ops@example.com "),
    ).toEqual({
      kind: BootstrapAllowlistKind.CONFIGURED,
      emails: ["root@example.com", "ops@example.com"],
    });
  });

  it("treats a missing or blank allowlist as not configured", () => {
    expect(parse_bootstrap_allowlist(undefined)).toEqual({
      kind: BootstrapAllowlistKind.NOT_CONFIGURED,
    });
    expect(parse_bootstrap_allowlist(" , ")).toEqual({
      kind: BootstrapAllowlistKind.NOT_CONFIGURED,
    });
  });

  it("refuses bootstrap when the allowlist is not configured", () => {
    expect(
      decide(EMPTY_SYSTEM, STRANGER, STRANGER.email, {
        kind: BootstrapAllowlistKind.NOT_CONFIGURED,
      }),
    ).toBe(SeedRejection.BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED);
  });

  it("refuses bootstrap for emails outside the allowlist", () => {
    expect(
      decide(EMPTY_SYSTEM, STRANGER, STRANGER.email, {
        kind: BootstrapAllowlistKind.CONFIGURED,
        emails: ["root@example.com"],
      }),
    ).toBe(SeedRejection.BOOTSTRAP_EMAIL_NOT_ALLOWED);
  });

  it("refuses bootstrap when the caller email is not verified", () => {
    expect(
      decide(
        EMPTY_SYSTEM,
        { ...STRANGER, email_verified: false },
        STRANGER.email,
      ),
    ).toBe(SeedRejection.BOOTSTRAP_EMAIL_UNVERIFIED);
  });
});
