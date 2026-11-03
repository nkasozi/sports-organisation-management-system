import type { BracketLayout } from "./competitionBracket";

export interface BracketDimensions {
  card_width: number;
  card_height: number;
  row_height: number;
  column_gap: number;
}

interface BracketCardPosition {
  left: number;
  top: number;
}

interface CardSpot {
  column_index: number;
  row: number;
}

const HALF = 2;

export const EMPTY_BRACKET_LAYOUT: BracketLayout = {
  columns: [],
  links: [],
  row_count: 0,
};

export function position_bracket_card(
  column_index: number,
  row: number,
  dimensions: BracketDimensions,
): BracketCardPosition {
  return {
    left: column_index * (dimensions.card_width + dimensions.column_gap),
    top: row * dimensions.row_height,
  };
}

export function measure_bracket(
  layout: BracketLayout,
  dimensions: BracketDimensions,
): { width: number; height: number } {
  const column_count = layout.columns.length;
  return {
    width:
      column_count * dimensions.card_width +
      Math.max(0, column_count - 1) * dimensions.column_gap,
    height:
      Math.max(0, layout.row_count - 1) * dimensions.row_height +
      dimensions.card_height,
  };
}

export function build_bracket_link_paths(
  layout: BracketLayout,
  dimensions: BracketDimensions,
): string[] {
  const spots = new Map<string, CardSpot>();
  layout.columns.forEach((column, column_index) =>
    column.cards.forEach((card) =>
      spots.set(card.card_id, { column_index, row: card.row }),
    ),
  );
  return layout.links.flatMap((link) => {
    const from = spots.get(link.from_card_id);
    const to = spots.get(link.to_card_id);
    if (!from || !to) return [];
    const start = position_bracket_card(
      from.column_index,
      from.row,
      dimensions,
    );
    const end = position_bracket_card(to.column_index, to.row, dimensions);
    const start_x = start.left + dimensions.card_width;
    const start_y = start.top + dimensions.card_height / HALF;
    const end_y = end.top + dimensions.card_height / HALF;
    const elbow_x = start_x + dimensions.column_gap / HALF;
    return [`M ${start_x} ${start_y} H ${elbow_x} V ${end_y} H ${end.left}`];
  });
}
