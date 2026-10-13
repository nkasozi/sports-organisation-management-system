import { describe, expect, it } from "vitest";

import {
  build_parent_record_lookup,
  ParentResolutionKind,
  resolve_parent_organization,
} from "./parent_organization_resolution";
import { PARENT_REFERENCE_SPECS } from "./parent_reference_specs";
import {
  TABLE_TENANCY_STRATEGIES,
  TableTenancyStrategy,
} from "./table_tenancy";

const LOOKUP = build_parent_record_lookup({
  competitions: [
    { local_id: "competition_a", organization_id: "org_a" },
    { local_id: "competition_shared", organization_id: "*" },
  ],
  players: [{ local_id: "player_a", organization_id: "org_a" }],
  teams: [{ local_id: "team_b", organization_id: "org_b" }],
  player_profiles: [{ local_id: "player_profile_a", player_id: "player_a" }],
  team_profiles: [{ local_id: "team_profile_b", team_id: "team_b" }],
});

describe("parent reference specs", () => {
  it("cover exactly the parent scoped tables", () => {
    const parent_scoped_tables = Object.entries(TABLE_TENANCY_STRATEGIES)
      .filter(([, strategy]) => strategy === TableTenancyStrategy.PARENT_SCOPED)
      .map(([table_name]) => table_name)
      .sort();
    expect(Object.keys(PARENT_REFERENCE_SPECS).sort()).toEqual(
      parent_scoped_tables,
    );
  });
});

describe("resolve_parent_organization", () => {
  it("resolves a direct parent's organization", () => {
    expect(
      resolve_parent_organization(
        "competition_stages",
        { competition_id: "competition_a" },
        LOOKUP,
      ),
    ).toEqual({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id: "org_a",
    });
  });

  it("reports missing references, missing parents and shared parents", () => {
    expect(
      resolve_parent_organization("competition_stages", {}, LOOKUP).kind,
    ).toBe(ParentResolutionKind.PARENT_REFERENCE_MISSING);
    expect(
      resolve_parent_organization(
        "competition_teams",
        { competition_id: "competition_gone" },
        LOOKUP,
      ).kind,
    ).toBe(ParentResolutionKind.PARENT_NOT_FOUND);
    expect(
      resolve_parent_organization(
        "competition_teams",
        { competition_id: "competition_shared" },
        LOOKUP,
      ).kind,
    ).toBe(ParentResolutionKind.PARENT_SHARED);
  });

  it("resolves typed holders and rejects unsupported holder types", () => {
    expect(
      resolve_parent_organization(
        "identifications",
        { holder_type: "player", holder_id: "player_a" },
        LOOKUP,
      ),
    ).toEqual({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id: "org_a",
    });
    expect(
      resolve_parent_organization(
        "qualifications",
        { holder_type: "player", holder_id: "player_a" },
        LOOKUP,
      ).kind,
    ).toBe(ParentResolutionKind.UNSUPPORTED_PARENT_TYPE);
  });

  it("resolves nested parents through player and team profiles", () => {
    expect(
      resolve_parent_organization(
        "profile_links",
        { profile_id: "player_profile_a" },
        LOOKUP,
      ),
    ).toEqual({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id: "org_a",
    });
    expect(
      resolve_parent_organization(
        "profile_links",
        { profile_id: "team_profile_b" },
        LOOKUP,
      ),
    ).toEqual({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id: "org_b",
    });
  });
});
