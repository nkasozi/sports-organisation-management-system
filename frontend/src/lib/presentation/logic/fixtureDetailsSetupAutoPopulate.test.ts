import { describe, expect, it, vi } from "vitest";

import {
  assign_officials_to_roles,
  type FixtureDetailsSetupAutoPopulateDependencies,
  load_fixture_details_setup_auto_populated_data,
} from "./fixtureDetailsSetupAutoPopulate";

const FIXTURE = {
  id: "fixture-1",
  home_team_id: "home",
  away_team_id: "away",
  competition_id: "competition-1",
  organization_id: "organization-1",
};

function list_of(ids: string[]): {
  success: boolean;
  data: { items: { id: string }[] };
} {
  return { success: true, data: { items: ids.map((id) => ({ id })) } };
}

function create_dependencies(
  overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {},
): FixtureDetailsSetupAutoPopulateDependencies {
  const jersey_list = vi.fn(async (filter: { holder_id?: string }) =>
    filter.holder_id ? list_of([]) : list_of(["any-official-jersey"]),
  );
  return {
    fixture_use_cases: {
      get_by_id: vi.fn(async () => ({ success: true, data: FIXTURE })),
    },
    jersey_color_use_cases: {
      list: overrides.jersey_list || jersey_list,
      list_jerseys_by_entity: vi.fn(async (_type: string, team_id: string) =>
        team_id === "home" ? list_of(["home-jersey"]) : list_of([]),
      ),
    },
    official_use_cases: {
      list: vi.fn(async () => list_of(["official-1", "official-2"])),
    },
    game_official_role_use_cases: {
      list:
        overrides.role_list || vi.fn(async () => list_of(["r1", "r2", "r3"])),
    },
    competition_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "comp", organization_id: "org", rule_overrides: {} },
      })),
    },
    organization_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "org", sport_id: "sport" },
      })),
    },
    sport_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true,
        data: { id: "sport", official_requirements: [] },
      })),
    },
  } as unknown as FixtureDetailsSetupAutoPopulateDependencies;
}

describe("fixtureDetailsSetupAutoPopulate", () => {
  it("returns only the fixture id when the fixture cannot be loaded", async () => {
    const dependencies = create_dependencies();
    vi.mocked(dependencies.fixture_use_cases.get_by_id).mockResolvedValue({
      success: false,
    } as never);
    await expect(
      load_fixture_details_setup_auto_populated_data("fixture-1", dependencies),
    ).resolves.toEqual({ fixture_id: "fixture-1" });
  });

  it("prefills jerseys, falls back to any official jersey and assigns officials", async () => {
    const dependencies = create_dependencies();
    const result = await load_fixture_details_setup_auto_populated_data(
      "fixture-1",
      dependencies,
    );
    expect(result).toEqual({
      fixture_id: "fixture-1",
      organization_id: "organization-1",
      home_team_jersey_id: "home-jersey",
      official_jersey_id: "any-official-jersey",
      assigned_officials: [
        { official_id: "official-1", role_id: "r1" },
        { official_id: "official-2", role_id: "r2" },
      ],
    });
    expect(dependencies.jersey_color_use_cases.list).toHaveBeenCalledWith({
      holder_type: "competition_official",
    });
    expect(dependencies.game_official_role_use_cases.list).toHaveBeenCalledWith(
      { organization_id: "organization-1" },
      { page_number: 1, page_size: 100 },
    );
  });

  it("uses the competition official jersey and skips assignment without roles", async () => {
    const jersey_list = vi.fn(async () => list_of(["competition-jersey"]));
    const role_list = vi.fn(async () => ({ success: false }));
    const dependencies = create_dependencies({ jersey_list, role_list });
    const result = await load_fixture_details_setup_auto_populated_data(
      "fixture-1",
      dependencies,
    );
    expect(result.official_jersey_id).toBe("competition-jersey");
    expect(result).not.toHaveProperty("assigned_officials");
    expect(jersey_list).toHaveBeenCalledTimes(1);
  });

  it("assigns each official to at most one role", () => {
    expect(
      assign_officials_to_roles(
        [{ id: "o1" }] as never,
        [{ id: "r1" }, { id: "r2" }] as never,
        [],
      ),
    ).toEqual([{ official_id: "o1", role_id: "r1" }]);
  });
});
