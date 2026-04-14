import { afterEach, describe, expect, it, vi } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

const fixture_lineup_detail_page_load_mocks = vi.hoisted(() => ({
  load_fixture_lineup_detail_page_data: vi.fn(),
}));

vi.mock("./fixtureLineupDetailPageLoad", () => ({
  load_fixture_lineup_detail_page_data:
    fixture_lineup_detail_page_load_mocks.load_fixture_lineup_detail_page_data,
}));

import { load_fixture_lineup_detail_view_data } from "./fixtureLineupDetailPageData";

const load_fixture_lineup_detail_page_data =
  fixture_lineup_detail_page_load_mocks.load_fixture_lineup_detail_page_data;
type FixtureLineupDetailCurrentProfile = NonNullable<
  Parameters<typeof load_fixture_lineup_detail_view_data>[1]
>;

function create_profile(
  overrides: Partial<FixtureLineupDetailCurrentProfile> = {},
): FixtureLineupDetailCurrentProfile {
  return {
    organization_id: "org_1",
    ...overrides,
  };
}

afterEach((): void => {
  vi.clearAllMocks();
});

describe("load_fixture_lineup_detail_view_data", () => {
  it("passes the scoped organization id through to the page loader", async () => {
    load_fixture_lineup_detail_page_data.mockResolvedValue({
      success: true,
      data: { lineup: { id: "lineup_1" } },
    });

    const dependencies = {
      get_fixture_by_id: vi.fn(),
      get_team_by_id: vi.fn(),
      list_players_by_team: vi.fn(),
      list_memberships_by_team: vi.fn(),
      list_positions: vi.fn(),
    } as never;

    const result = await load_fixture_lineup_detail_view_data(
      "lineup_1",
      create_profile(),
      dependencies,
    );

    expect(load_fixture_lineup_detail_page_data).toHaveBeenCalledWith({
      lineup_id: "lineup_1",
      organization_id: "org_1",
      dependencies,
    });
    expect(result).toEqual({
      success: true,
      data: { lineup: { id: "lineup_1" } },
    });
  });

  it("drops wildcard and missing organizations when loading the view data", async () => {
    load_fixture_lineup_detail_page_data.mockResolvedValue({
      success: true,
      data: { lineup: { id: "lineup_1" } },
    });

    await load_fixture_lineup_detail_view_data(
      "lineup_1",
      create_profile({ organization_id: ANY_VALUE }),
      {} as never,
    );
    await load_fixture_lineup_detail_view_data("lineup_1", null, {} as never);

    expect(load_fixture_lineup_detail_page_data).toHaveBeenNthCalledWith(1, {
      lineup_id: "lineup_1",
      organization_id: undefined,
      dependencies: {} as never,
    });
    expect(load_fixture_lineup_detail_page_data).toHaveBeenNthCalledWith(2, {
      lineup_id: "lineup_1",
      organization_id: undefined,
      dependencies: {} as never,
    });
  });

  it("maps page loader failures to the view model error shape", async () => {
    load_fixture_lineup_detail_page_data.mockResolvedValue({
      success: false,
      error: "Load failed",
    });

    const result = await load_fixture_lineup_detail_view_data(
      "lineup_1",
      create_profile(),
      {} as never,
    );

    expect(result).toEqual({
      success: false,
      error_message: "Load failed",
    });
  });
});
