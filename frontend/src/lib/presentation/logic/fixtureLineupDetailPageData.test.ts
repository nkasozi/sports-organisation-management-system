import { afterEach, describe, expect, it, vi } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  build_fixture_lineup_detail_profile_state,
  type FixtureLineupDetailCurrentProfile,
  load_fixture_lineup_detail_view_data,
} from "./fixtureLineupDetailPageData";

const missing_fixture_lineup_detail_entity_state = {
  status: "missing",
} as const;

function create_fixture_lineup_detail_view_data() {
  return {
    lineup: { id: "lineup_1" },
    fixture_state: missing_fixture_lineup_detail_entity_state,
    team_state: missing_fixture_lineup_detail_entity_state,
    team_players: [],
    home_team_state: missing_fixture_lineup_detail_entity_state,
    away_team_state: missing_fixture_lineup_detail_entity_state,
  };
}

const fixture_lineup_detail_page_load_mocks = vi.hoisted(() => ({
  load_fixture_lineup_detail_page_data: vi.fn(),
}));

vi.mock("./fixtureLineupDetailPageLoad", () => ({
  load_fixture_lineup_detail_page_data:
    fixture_lineup_detail_page_load_mocks.load_fixture_lineup_detail_page_data,
}));

const load_fixture_lineup_detail_page_data =
  fixture_lineup_detail_page_load_mocks.load_fixture_lineup_detail_page_data;

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
      data: create_fixture_lineup_detail_view_data(),
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
      build_fixture_lineup_detail_profile_state({
        status: "present",
        profile: create_profile(),
      }),
      dependencies,
    );

    expect(load_fixture_lineup_detail_page_data).toHaveBeenCalledWith({
      lineup_id: "lineup_1",
      organization_scope_state: { status: "scoped", organization_id: "org_1" },
      dependencies,
    });
    expect(result).toEqual({
      success: true,
      data: create_fixture_lineup_detail_view_data(),
    });
  });

  it("drops wildcard and missing organizations when loading the view data", async () => {
    load_fixture_lineup_detail_page_data.mockResolvedValue({
      success: true,
      data: create_fixture_lineup_detail_view_data(),
    });

    await load_fixture_lineup_detail_view_data(
      "lineup_1",
      build_fixture_lineup_detail_profile_state({
        status: "present",
        profile: create_profile({ organization_id: ANY_VALUE }),
      }),
      {} as never,
    );
    await load_fixture_lineup_detail_view_data(
      "lineup_1",
      build_fixture_lineup_detail_profile_state({ status: "missing" }),
      {} as never,
    );

    expect(load_fixture_lineup_detail_page_data).toHaveBeenNthCalledWith(1, {
      lineup_id: "lineup_1",
      organization_scope_state: { status: "unscoped" },
      dependencies: {} as never,
    });
    expect(load_fixture_lineup_detail_page_data).toHaveBeenNthCalledWith(2, {
      lineup_id: "lineup_1",
      organization_scope_state: { status: "unscoped" },
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
      build_fixture_lineup_detail_profile_state({
        status: "present",
        profile: create_profile(),
      }),
      {} as never,
    );

    expect(result).toEqual({
      success: false,
      error_message: "Load failed",
    });
  });
});
