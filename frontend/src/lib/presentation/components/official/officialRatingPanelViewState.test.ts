import { describe, expect, it } from "vitest";

import type { OfficialRatingState } from "$lib/presentation/logic/officialRatingPanelState";

import { build_official_rating_submit_input } from "./officialRatingPanelViewState";

describe("build_official_rating_submit_input", () => {
  it("copies the rating dimensions and submit context", () => {
    const state = {
      official: { id: "official-1" },
      rating: {
        overall: 8,
        decision_accuracy: 7,
        game_control: 6,
        communication: 5,
        fitness: 4,
        notes: "solid",
      },
    } as unknown as OfficialRatingState;
    const input = build_official_rating_submit_input(state, {
      organization_id: "org-1",
      fixture_id: "fixture-1",
      rater_user_id: "user-1",
      rater_role: "team_manager",
    });
    expect(input).toMatchObject({
      organization_id: "org-1",
      fixture_id: "fixture-1",
      official_id: "official-1",
      overall: 8,
      fitness: 4,
      notes: "solid",
    });
    expect(typeof input.submitted_at).toBe("string");
  });
});
