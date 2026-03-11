import { describe, expect, it } from "vitest";
import {
  add_stage_template,
  build_stage_template_defaults,
  create_empty_stage_template,
  normalize_stage_template_order,
  remove_stage_template_at_index,
  update_stage_template_at_index,
} from "./competitionFormatStageTemplateLogic";

describe("competitionFormatStageTemplateLogic", () => {
  it("builds default templates from format type", () => {
    expect(build_stage_template_defaults("groups_knockout")).toEqual([
      {
        name: "Pool Stage",
        stage_type: "group_stage",
        stage_order: 1,
      },
      {
        name: "Semi Finals",
        stage_type: "knockout_stage",
        stage_order: 2,
      },
      {
        name: "Final",
        stage_type: "one_off_stage",
        stage_order: 3,
      },
    ]);
  });

  it("builds league templates using league round count", () => {
    expect(
      build_stage_template_defaults("league", {
        number_of_rounds: 3,
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
        promotion_spots: 0,
        relegation_spots: 0,
        playoff_spots: 0,
      }),
    ).toEqual([
      {
        name: "Round 1",
        stage_type: "league_stage",
        stage_order: 1,
      },
      {
        name: "Round 2",
        stage_type: "league_stage",
        stage_order: 2,
      },
      {
        name: "Round 3",
        stage_type: "league_stage",
        stage_order: 3,
      },
    ]);
  });

  it("creates an empty custom stage template", () => {
    expect(create_empty_stage_template(4)).toEqual({
      name: "Stage 4",
      stage_type: "custom",
      stage_order: 4,
    });
  });

  it("adds a new stage template and reindexes order", () => {
    const result = add_stage_template([
      {
        name: "Pool Stage",
        stage_type: "group_stage",
        stage_order: 4,
      },
    ]);

    expect(result).toEqual([
      {
        name: "Pool Stage",
        stage_type: "group_stage",
        stage_order: 1,
      },
      {
        name: "Stage 2",
        stage_type: "custom",
        stage_order: 2,
      },
    ]);
  });

  it("updates a stage template and keeps sequential ordering", () => {
    const result = update_stage_template_at_index(
      [
        {
          name: "Pool Stage",
          stage_type: "group_stage",
          stage_order: 1,
        },
        {
          name: "Final",
          stage_type: "one_off_stage",
          stage_order: 2,
        },
      ],
      1,
      {
        name: "Championship Final",
        stage_type: "knockout_stage",
      },
    );

    expect(result).toEqual([
      {
        name: "Pool Stage",
        stage_type: "group_stage",
        stage_order: 1,
      },
      {
        name: "Championship Final",
        stage_type: "knockout_stage",
        stage_order: 2,
      },
    ]);
  });

  it("removes a stage template and reindexes order", () => {
    const result = remove_stage_template_at_index(
      [
        {
          name: "Pool Stage",
          stage_type: "group_stage",
          stage_order: 1,
        },
        {
          name: "Semi Finals",
          stage_type: "knockout_stage",
          stage_order: 2,
        },
        {
          name: "Final",
          stage_type: "one_off_stage",
          stage_order: 3,
        },
      ],
      1,
    );

    expect(result).toEqual([
      {
        name: "Pool Stage",
        stage_type: "group_stage",
        stage_order: 1,
      },
      {
        name: "Final",
        stage_type: "one_off_stage",
        stage_order: 2,
      },
    ]);
  });

  it("normalizes stage ordering regardless of source order values", () => {
    expect(
      normalize_stage_template_order([
        {
          name: "Stage A",
          stage_type: "custom",
          stage_order: 7,
        },
        {
          name: "Stage B",
          stage_type: "custom",
          stage_order: 9,
        },
      ]),
    ).toEqual([
      {
        name: "Stage A",
        stage_type: "custom",
        stage_order: 1,
      },
      {
        name: "Stage B",
        stage_type: "custom",
        stage_order: 2,
      },
    ]);
  });
});
