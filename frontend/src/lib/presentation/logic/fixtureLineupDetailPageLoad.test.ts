import { describe, expect, it, vi } from "vitest";

import { create_failure_result } from "$lib/core/types/Result";

import { load_fixture_lineup_detail_page_data } from "./fixtureLineupDetailPageLoad";
import {
  create_dependencies,
  create_paginated_result,
  create_position,
} from "./fixtureLineupDetailPageLoad.test_support";

describe("load_fixture_lineup_detail_page_data", () => {
  it("returns a failure result when the lineup cannot be found", async () => {
    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "missing",
      organization_scope_state: { status: "scoped", organization_id: "org_1" },
      dependencies: create_dependencies({
        get_fixture_lineup_by_id: async () =>
          create_failure_result("Lineup not found"),
      }),
    });

    expect(result.success).toBe(false);
    expect(result).toEqual({ success: false, error: "Lineup not found" });
  });

  it("passes the organization filter to positions and builds the derived team players", async () => {
    const list_positions = vi.fn(async () =>
      create_paginated_result([create_position()]),
    );

    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "lineup_1",
      organization_scope_state: { status: "scoped", organization_id: "org_1" },
      dependencies: create_dependencies({ list_positions }),
    });

    expect(list_positions).toHaveBeenCalledWith(
      { organization_id: "org_1" },
      { page_number: 1, page_size: 500 },
    );
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.team_players).toHaveLength(1);
    expect(result.data.team_players[0].position).toBe("Forward");
    expect(result.data.home_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Lions" }),
    });
    expect(result.data.away_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Tigers" }),
    });
  });

  it("keeps loading without fixture or team lookup success and omits the position filter when unscoped", async () => {
    const list_positions = vi.fn(async () =>
      create_paginated_result([create_position()]),
    );

    const result = await load_fixture_lineup_detail_page_data({
      lineup_id: "lineup_1",
      organization_scope_state: { status: "unscoped" },
      dependencies: create_dependencies({
        get_fixture_by_id: async () => create_failure_result("missing fixture"),
        get_team_by_id: async () => create_failure_result("missing team"),
        list_positions,
      }),
    });

    expect(list_positions).toHaveBeenCalledWith(void 0, {
      page_number: 1,
      page_size: 500,
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.fixture_state).toEqual({ status: "missing" });
    expect(result.data.team_state).toEqual({ status: "missing" });
    expect(result.data.home_team_state).toEqual({ status: "missing" });
    expect(result.data.away_team_state).toEqual({ status: "missing" });
  });
});
