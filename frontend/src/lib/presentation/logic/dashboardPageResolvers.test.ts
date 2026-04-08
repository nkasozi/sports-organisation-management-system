import { describe, expect, it, vi } from "vitest";

import {
  resolve_fixture_display_names,
  resolve_sport_names_for_competitions,
} from "./dashboardPageResolvers";

describe("dashboardPageResolvers", () => {
  it("resolves competition sport names and falls back when organization or sport lookups fail", async () => {
    const organization_get_by_id = vi.fn(async (organization_id: string) =>
      organization_id === "org-1"
        ? { success: true, data: { id: "org-1", sport_id: "sport-1" } }
        : { success: false },
    );
    const sport_get_by_id = vi.fn(async () => ({
      success: true,
      data: { id: "sport-1", name: "Football" },
    }));

    expect(
      await resolve_sport_names_for_competitions(
        [
          { id: "competition-1", organization_id: "org-1" },
          { id: "competition-2", organization_id: "org-2" },
        ] as never,
        {
          organization_use_cases: { get_by_id: organization_get_by_id },
          sport_use_cases: { get_by_id: sport_get_by_id },
        } as never,
      ),
    ).toEqual({
      "competition-1": "Football",
      "competition-2": "Unknown Sport",
    });
  });

  it("deduplicates fixture competition lookups and fills unknown display labels on failure", async () => {
    const competition_get_by_id = vi.fn(async (competition_id: string) =>
      competition_id === "competition-1"
        ? {
            success: true,
            data: {
              id: "competition-1",
              name: "Premier League",
              organization_id: "org-1",
            },
          }
        : { success: false },
    );
    const organization_get_by_id = vi.fn(async () => ({
      success: true,
      data: { id: "org-1", sport_id: "sport-1" },
    }));
    const sport_get_by_id = vi.fn(async () => ({
      success: true,
      data: { id: "sport-1", name: "Football" },
    }));

    expect(
      await resolve_fixture_display_names(
        [
          { competition_id: "competition-1" },
          { competition_id: "competition-1" },
          { competition_id: "competition-2" },
        ] as never,
        {
          competition_use_cases: { get_by_id: competition_get_by_id },
          organization_use_cases: { get_by_id: organization_get_by_id },
          sport_use_cases: { get_by_id: sport_get_by_id },
        } as never,
      ),
    ).toEqual({
      competition_names: {
        "competition-1": "Premier League",
        "competition-2": "Unknown Competition",
      },
      sport_names: {
        "competition-1": "Football",
        "competition-2": "Unknown Sport",
      },
    });
    expect(competition_get_by_id).toHaveBeenCalledTimes(2);
  });
});
