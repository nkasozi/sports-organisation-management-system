import { describe, expect, it, vi } from "vitest";

import { load_match_report_competition_bundle } from "./matchReportPageLoadCompetition";

const FIXTURE = { competition_id: "competition_1" } as never;

function create_dependencies(
  competition_result: unknown,
  organization_result: unknown,
  sport_result: unknown,
): never {
  return {
    competition_use_cases: {
      get_by_id: vi.fn().mockResolvedValue(competition_result),
    },
    organization_use_cases: {
      get_by_id: vi.fn().mockResolvedValue(organization_result),
    },
    sport_use_cases: { get_by_id: vi.fn().mockResolvedValue(sport_result) },
  } as never;
}

const competition = { id: "competition_1", organization_id: "org_1" };

describe("matchReportPageLoadCompetition", () => {
  it("returns a missing bundle when the competition lookup fails", async () => {
    await expect(
      load_match_report_competition_bundle(
        FIXTURE,
        create_dependencies({ success: false }, {}, {}),
      ),
    ).resolves.toEqual({
      competition_state: { status: "missing" },
      organization_name: "",
      sport_state: { status: "missing" },
    });
  });

  it("keeps the competition when it has no organization", async () => {
    const bundle = await load_match_report_competition_bundle(
      FIXTURE,
      create_dependencies(
        { success: true, data: { id: "competition_1" } },
        {},
        {},
      ),
    );
    expect(bundle).toEqual({
      competition_state: {
        status: "present",
        competition: { id: "competition_1" },
      },
      organization_name: "",
      sport_state: { status: "missing" },
    });
  });

  it("drops the organization name when the organization lookup fails", async () => {
    const bundle = await load_match_report_competition_bundle(
      FIXTURE,
      create_dependencies(
        { success: true, data: competition },
        { success: false },
        {},
      ),
    );
    expect(bundle.organization_name).toBe("");
    expect(bundle.sport_state).toEqual({ status: "missing" });
  });

  it("keeps the organization name without a sport", async () => {
    const bundle = await load_match_report_competition_bundle(
      FIXTURE,
      create_dependencies(
        { success: true, data: competition },
        { success: true, data: { name: "League" } },
        {},
      ),
    );
    expect(bundle.organization_name).toBe("League");
    expect(bundle.sport_state).toEqual({ status: "missing" });
  });

  it("marks the sport missing when the sport lookup fails", async () => {
    const bundle = await load_match_report_competition_bundle(
      FIXTURE,
      create_dependencies(
        { success: true, data: competition },
        { success: true, data: { name: "League", sport_id: "sport_1" } },
        { success: false },
      ),
    );
    expect(bundle).toEqual({
      competition_state: { status: "present", competition },
      organization_name: "League",
      sport_state: { status: "missing" },
    });
  });
});
