import { describe, expect, it } from "vitest";

import type { BracketLayout } from "./competitionBracket";
import {
  build_bracket_link_paths,
  measure_bracket,
  position_bracket_card,
} from "./competitionBracketGeometry";
import { PRESENCE_STATUS } from "./presenceStatus";

const DIMENSIONS = {
  card_width: 200,
  card_height: 80,
  row_height: 100,
  column_gap: 40,
};

const layout = {
  columns: [
    {
      stage: { id: "r16" },
      cards: [
        { card_id: "a", row: 0, content: { status: PRESENCE_STATUS.MISSING } },
        { card_id: "b", row: 1, content: { status: PRESENCE_STATUS.MISSING } },
      ],
    },
    {
      stage: { id: "qf" },
      cards: [
        {
          card_id: "c",
          row: 0.5,
          content: { status: PRESENCE_STATUS.MISSING },
        },
      ],
    },
  ],
  links: [
    { from_card_id: "a", to_card_id: "c" },
    { from_card_id: "missing", to_card_id: "c" },
  ],
  row_count: 2,
} as unknown as BracketLayout;

describe("bracket geometry", () => {
  it("places cards by column and row", () => {
    expect(position_bracket_card(1, 0.5, DIMENSIONS)).toEqual({
      left: 240,
      top: 50,
    });
  });

  it("measures the whole bracket", () => {
    expect(measure_bracket(layout, DIMENSIONS)).toEqual({
      width: 440,
      height: 180,
    });
  });

  it("draws an elbow from a card's right edge to the next card's left edge, skipping unknown cards", () => {
    expect(build_bracket_link_paths(layout, DIMENSIONS)).toEqual([
      "M 200 40 H 220 V 90 H 240",
    ]);
  });
});
