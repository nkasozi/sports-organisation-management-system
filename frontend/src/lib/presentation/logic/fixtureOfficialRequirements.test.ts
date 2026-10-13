import { describe, expect, it, vi } from "vitest";

import { load_fixture_official_requirements } from "./fixtureOfficialRequirements";

const UMPIRES = [
  {
    role_id: "umpire",
    role_name: "Umpire",
    minimum_count: 2,
    maximum_count: 2,
    is_mandatory: true,
    description: "",
  },
];

function create_dependencies(
  competition: object,
): Parameters<typeof load_fixture_official_requirements>[1] {
  return {
    competition_use_cases: {
      get_by_id: vi.fn(async () => ({ success: true, data: competition })),
    },
    organization_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "org_1", sport_id: "sport_netball" },
      })),
    },
    sport_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "sport_netball", official_requirements: UMPIRES },
      })),
    },
  } as never;
}

describe("load_fixture_official_requirements", () => {
  it("uses the sport's official requirements", async () => {
    const requirements = await load_fixture_official_requirements(
      { competition_id: "comp_1" } as never,
      create_dependencies({
        id: "comp_1",
        organization_id: "org_1",
        rule_overrides: {},
      }),
    );

    expect(requirements).toEqual(UMPIRES);
  });

  it("prefers the competition's own official requirements", async () => {
    const override = [{ ...UMPIRES[0], minimum_count: 1 }];

    const requirements = await load_fixture_official_requirements(
      { competition_id: "comp_1" } as never,
      create_dependencies({
        id: "comp_1",
        organization_id: "org_1",
        rule_overrides: { official_requirements: override },
      }),
    );

    expect(requirements).toEqual(override);
  });

  it("returns no requirements and logs when the competition is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dependencies = create_dependencies({});
    dependencies.competition_use_cases.get_by_id = vi.fn(async () => ({
      success: false,
      error: "Competition not found",
    })) as never;

    const requirements = await load_fixture_official_requirements(
      { id: "fx_1", competition_id: "comp_1" } as never,
      dependencies,
    );

    expect(requirements).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      "[FixtureOfficials] Official requirements unavailable",
      expect.objectContaining({
        event: "fixture_official_requirements_unavailable",
        fixture_id: "fx_1",
      }),
    );
    warn.mockRestore();
  });
});
