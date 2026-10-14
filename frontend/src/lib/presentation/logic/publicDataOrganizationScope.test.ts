import { describe, expect, it } from "vitest";

import { build_public_organization_scope } from "./publicDataOrganizationScope";

describe("build_public_organization_scope", () => {
  it("scopes public data to a chosen organization", () => {
    expect(build_public_organization_scope(" org-1 ")).toEqual({
      status: "some",
      value: "org-1",
    });
  });

  it("has no organization scope when none is chosen", () => {
    expect(build_public_organization_scope("")).toEqual({ status: "none" });
    expect(build_public_organization_scope("  ")).toEqual({ status: "none" });
  });
});
