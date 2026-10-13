import { describe, expect, it, type Mock, vi } from "vitest";

import { load_competition_sport_rules } from "./competitionSportLookup";

const NETBALL = {
  id: "sport_netball",
  code: "NETBALL",
  scoring_rules: [{ event_type: "super_shot", points_awarded: 2 }],
  card_types: [],
};

function create_dependencies(sport_found: boolean): {
  organization_use_cases: { get_by_id: Mock };
  sport_use_cases: { get_by_id: Mock };
} {
  return {
    organization_use_cases: {
      get_by_id: vi.fn(async () => ({
        success: true as const,
        data: { id: "org_1", sport_id: "sport_netball" },
      })),
    },
    sport_use_cases: {
      get_by_id: vi.fn(async () =>
        sport_found
          ? { success: true as const, data: NETBALL }
          : { success: false as const, error: "Sport not found" },
      ),
    },
  };
}

describe("load_competition_sport_rules", () => {
  it("uses the sport of the competition's organisation", async () => {
    const dependencies = create_dependencies(true);

    const source = await load_competition_sport_rules(
      { organization_id: "org_1" } as never,
      dependencies as never,
    );

    expect(dependencies.organization_use_cases.get_by_id).toHaveBeenCalledWith(
      "org_1",
    );
    expect(source.event_source.sport_code).toBe("NETBALL");
    expect(source.event_source.scoring_rules).toEqual(NETBALL.scoring_rules);
  });

  it("falls back to default rules and logs when the sport cannot be found", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const source = await load_competition_sport_rules(
      { id: "comp_1", organization_id: "org_1" } as never,
      create_dependencies(false) as never,
    );

    expect(source.event_source.sport_code).toBe("");
    expect(warn).toHaveBeenCalledWith(
      "[CompetitionSport] Sport not found for competition",
      expect.objectContaining({ event: "competition_sport_not_found" }),
    );
    warn.mockRestore();
  });
});
