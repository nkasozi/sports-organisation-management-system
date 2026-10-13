import { describe, expect, it } from "vitest";

import {
  CallerScopeKind,
  filter_organization_owned_records,
  resolve_caller_scope,
} from "./caller_scope";

const ORGANIZATION_RECORDS = [
  { local_id: "log_a", organization_id: "org_a" },
  { local_id: "log_b", organization_id: "org_b" },
  { local_id: "log_unscoped" },
];

describe("resolve_caller_scope", () => {
  it("resolves the wildcard organization to the global scope", () => {
    expect(resolve_caller_scope({ organization_id: "*" })).toEqual({
      kind: CallerScopeKind.GLOBAL,
    });
  });

  it("resolves a concrete organization to an organization scope", () => {
    expect(resolve_caller_scope({ organization_id: "org_a" })).toEqual({
      kind: CallerScopeKind.ORGANIZATION,
      organization_id: "org_a",
    });
  });

  it("resolves missing or empty organizations to no scope", () => {
    expect(resolve_caller_scope({})).toEqual({ kind: CallerScopeKind.NONE });
    expect(resolve_caller_scope({ organization_id: "" })).toEqual({
      kind: CallerScopeKind.NONE,
    });
    expect(resolve_caller_scope({ organization_id: "   " })).toEqual({
      kind: CallerScopeKind.NONE,
    });
  });
});

describe("filter_organization_owned_records", () => {
  it("keeps everything for the global scope", () => {
    expect(
      filter_organization_owned_records(ORGANIZATION_RECORDS, {
        kind: CallerScopeKind.GLOBAL,
      }),
    ).toHaveLength(3);
  });

  it("keeps only matching organization records for an organization scope", () => {
    expect(
      filter_organization_owned_records(ORGANIZATION_RECORDS, {
        kind: CallerScopeKind.ORGANIZATION,
        organization_id: "org_a",
      }),
    ).toEqual([ORGANIZATION_RECORDS[0]]);
  });

  it("keeps nothing when the caller has no scope", () => {
    expect(
      filter_organization_owned_records(ORGANIZATION_RECORDS, {
        kind: CallerScopeKind.NONE,
      }),
    ).toEqual([]);
  });
});
