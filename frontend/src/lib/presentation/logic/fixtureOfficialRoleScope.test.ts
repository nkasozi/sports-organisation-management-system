import { describe, expect, it, vi } from "vitest";

import { load_fixture_official_role_scope } from "./fixtureOfficialRoleScope";

const REQUIREMENTS = [{ role_id: "umpire", role_name: "Umpire" }];

function create_dependencies(
  overrides: { fixture_found?: boolean; sport_found?: boolean } = {},
): Parameters<typeof load_fixture_official_role_scope>[1] {
  return {
    fixture_use_cases: {
      get_by_id: vi.fn(async () =>
        overrides.fixture_found === false
          ? { success: false, error: "missing fixture" }
          : {
              success: true,
              data: { id: "fixture_1", competition_id: "comp_1" },
            },
      ),
    },
    competition_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "comp_1", organization_id: "org_1", rule_overrides: {} },
      })),
    },
    organization_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "org_1", sport_id: "sport_wcb" },
      })),
    },
    sport_use_cases: {
      get_by_id: vi.fn(async () =>
        overrides.sport_found === false
          ? { success: false, error: "missing sport" }
          : {
              success: true,
              data: { id: "sport_wcb", official_requirements: REQUIREMENTS },
            },
      ),
    },
  } as never;
}

describe("load_fixture_official_role_scope", () => {
  it("returns the fixture's sport and its official requirements", async () => {
    expect(
      await load_fixture_official_role_scope(
        "fixture_1",
        create_dependencies(),
      ),
    ).toEqual({
      status: "some",
      value: { sport_id: "sport_wcb", requirements: REQUIREMENTS },
    });
  });

  it("has no scope before a fixture is chosen", async () => {
    const dependencies = create_dependencies();

    expect(await load_fixture_official_role_scope("", dependencies)).toEqual({
      status: "none",
    });
    expect(dependencies.fixture_use_cases.get_by_id).not.toHaveBeenCalled();
  });

  it("has no scope when the fixture cannot be found", async () => {
    expect(
      await load_fixture_official_role_scope(
        "fixture_1",
        create_dependencies({ fixture_found: false }),
      ),
    ).toEqual({ status: "none" });
  });

  it("has no scope when the sport cannot be found", async () => {
    expect(
      await load_fixture_official_role_scope(
        "fixture_1",
        create_dependencies({ sport_found: false }),
      ),
    ).toEqual({ status: "none" });
  });
});
