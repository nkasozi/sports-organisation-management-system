import type { jsPDF } from "jspdf";

import type {
  CardTypeConfig,
  MatchPlayerEntry,
} from "$lib/core/types/MatchReportTypes";

import { parse_hex_color } from "./pdfConstantsAndHelpers";

const TABLE_BODY_SECTION = "body";

export interface CellDrawData {
  section: string;
  column: { index: number };
  row: { index: number };
  cell: { x: number; y: number; width: number; height: number };
}

export type LineupColumnStyles = Record<
  string,
  { cellWidth: number; halign: "left" | "center" | "right" }
>;

const BASE_COLUMN_COUNT = 3;
const NAME_COLUMN_INDEX = 2;
const MINIMUM_LINEUP_ROWS = 18;
const BRIGHTNESS_THRESHOLD = 128;

export function build_column_styles(
  all_header_widths: number[],
): LineupColumnStyles {
  const column_styles: LineupColumnStyles = {};
  all_header_widths.forEach((width, index) => {
    column_styles[index.toString()] = {
      cellWidth: width,
      halign: index === NAME_COLUMN_INDEX ? "left" : "center",
    };
  });
  return column_styles;
}

export function build_player_table_data(
  players: MatchPlayerEntry[],
  card_count: number,
): string[][] {
  const empty_card_cells = Array.from({ length: card_count }, () => "");
  const rows = players.map((player) => [
    player.time_on,
    player.jersey_number.toString(),
    player.name,
    ...empty_card_cells,
  ]);
  while (rows.length < MINIMUM_LINEUP_ROWS) {
    rows.push(["", "", "", ...empty_card_cells]);
  }
  return rows;
}

function find_card_for_cell(
  cell_data: CellDrawData,
  players: MatchPlayerEntry[],
  card_types: CardTypeConfig[],
): { color: string; minute: string } | false {
  if (cell_data.section !== TABLE_BODY_SECTION) return false;
  const player = players[cell_data.row.index];
  if (!player || !player.cards || player.cards.length === 0) return false;
  const card_config = card_types[cell_data.column.index - BASE_COLUMN_COUNT];
  if (!card_config) return false;
  const player_card = player.cards.find((c) => c.card_type === card_config.id);
  if (!player_card) return false;
  return { color: card_config.color, minute: player_card.minute };
}

export function draw_card_indicators(
  doc: jsPDF,
  cell_data: CellDrawData,
  players: MatchPlayerEntry[],
  card_types: CardTypeConfig[],
): boolean {
  const card = find_card_for_cell(cell_data, players, card_types);
  if (!card) return false;
  const x = cell_data.cell.x + 0.5;
  const y_pos = cell_data.cell.y + 0.5;
  const w = cell_data.cell.width - 1;
  const h = cell_data.cell.height - 1;
  const { r, g, b } = parse_hex_color(card.color);
  doc.setFillColor(r, g, b);
  doc.rect(x, y_pos, w, h, "F");
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const text_color = brightness > BRIGHTNESS_THRESHOLD ? 0 : 255;
  doc.setFontSize(5);
  doc.setTextColor(text_color, text_color, text_color);
  doc.text(card.minute, x + w / 2, y_pos + h / 2 + 1, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return true;
}
