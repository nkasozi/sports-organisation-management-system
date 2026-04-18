import { describe, expect, it } from "vitest";

import {
  build_default_official_rating_dimensions,
  load_official_rating_states,
  OFFICIAL_RATING_DIMENSIONS,
} from "./officialRatingPanelState";

describe("officialRatingPanelState", () => {
  it("defines default rating dimensions with all tracked categories", () => {
    expect(
      OFFICIAL_RATING_DIMENSIONS.map((dimension) => dimension.key),
    ).toEqual([
      "overall",
      "decision_accuracy",
      "game_control",
      "communication",
      "fitness",
    ]);
    expect(build_default_official_rating_dimensions()).toEqual({
      overall: 5,
      decision_accuracy: 5,
      game_control: 5,
      communication: 5,
      fitness: 5,
      notes: "",
    });
  });

  it("loads only assigned officials and merges existing ratings for the current rater", async () => {
    expect(
      await load_official_rating_states(
        "fixture-1",
        "organization-1",
        ["official-1", "missing-official", "official-2"],
        "rater-1",
        {
          official_use_cases: {
            list: async () => ({
              success: true,
              data: {
                items: [
                  { id: "official-1", name: "Ref One" },
                  { id: "official-2", name: "Ref Two" },
                ],
              },
            }),
          },
          rating_use_cases: {
            list_by_fixture: async () => ({
              success: true,
              data: {
                items: [
                  {
                    id: "rating-1",
                    official_id: "official-1",
                    rater_user_id: "rater-1",
                    overall: 4,
                    decision_accuracy: 3,
                    game_control: 4,
                    communication: 5,
                    fitness: 4,
                    notes: "Solid performance",
                  },
                  {
                    id: "rating-2",
                    official_id: "official-2",
                    rater_user_id: "other-rater",
                    overall: 1,
                    decision_accuracy: 1,
                    game_control: 1,
                    communication: 1,
                    fitness: 1,
                    notes: "Ignored",
                  },
                ],
              },
            }),
          },
        } as never,
      ),
    ).toEqual([
      {
        official: { id: "official-1", name: "Ref One" },
        rating: {
          overall: 4,
          decision_accuracy: 3,
          game_control: 4,
          communication: 5,
          fitness: 4,
          notes: "Solid performance",
        },
        existing_id: "rating-1",
        is_saving: false,
        validation_errors: [],
      },
      {
        official: { id: "official-2", name: "Ref Two" },
        rating: build_default_official_rating_dimensions(),
        existing_id: "",
        is_saving: false,
        validation_errors: [],
      },
    ]);
  });
});
