import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  CardTypeConfig,
  MatchPlayerEntry,
  MatchReportData,
} from "$lib/core/types/MatchReportTypes";

import {
  FONT_SIZE_SMALL,
  HALF_WIDTH,
  type JsPDFWithAutoTable,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
} from "./pdfConstantsAndHelpers";
import {
  build_column_styles,
  build_player_table_data,
  draw_card_indicators,
  type LineupColumnStyles,
} from "./pdfLineupTableData";
import { draw_team_staff_rows } from "./pdfStaffOfficialsSection";

interface LineupTableLayout {
  headers: string[][];
  column_styles: LineupColumnStyles;
  card_types: CardTypeConfig[];
  start_y: number;
}

interface LineupTableSide {
  players: MatchPlayerEntry[];
  left_margin: number;
  right_margin: number;
}

const CARD_COLUMN_WIDTH = 5;
const BASE_HEADERS = ["Time On", "Shirt No.", "Names"];
const BASE_HEADER_WIDTHS = [10, 10, 40];
const MISSING_TABLE_HEIGHT = 100;
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

function build_lineup_layout(
  card_types: CardTypeConfig[],
  start_y: number,
): LineupTableLayout {
  return {
    headers: [[...BASE_HEADERS, ...card_types.map((ct) => ct.name.charAt(0))]],
    column_styles: build_column_styles([
      ...BASE_HEADER_WIDTHS,
      ...card_types.map(() => CARD_COLUMN_WIDTH),
    ]),
    card_types,
    start_y,
  };
}

function draw_lineup_table(
  doc: jsPDF,
  layout: LineupTableLayout,
  side: LineupTableSide,
): number {
  autoTable(doc, {
    startY: layout.start_y,
    head: layout.headers,
    body: build_player_table_data(side.players, layout.card_types.length),
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1,
      halign: "center",
      lineColor: BLACK,
      lineWidth: 0.3,
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: WHITE,
      textColor: BLACK,
      fontStyle: "bold",
      fontSize: 6,
    },
    bodyStyles: { fillColor: WHITE, textColor: BLACK },
    columnStyles: layout.column_styles,
    margin: { left: side.left_margin, right: side.right_margin },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) =>
      draw_card_indicators(doc, cell_data, side.players, layout.card_types),
  });
  return (
    (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ??
    layout.start_y + MISSING_TABLE_HEIGHT
  );
}

export function draw_lineup_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  const layout = build_lineup_layout(data.card_types || [], y_start + 3);
  const center_margin = PAGE_WIDTH / 2 + 5;
  const home_final_y = draw_lineup_table(doc, layout, {
    players: data.home_players,
    left_margin: MARGIN_LEFT,
    right_margin: center_margin,
  });
  const away_final_y = draw_lineup_table(doc, layout, {
    players: data.away_players,
    left_margin: center_margin,
    right_margin: MARGIN_RIGHT,
  });
  return draw_team_staff_rows(
    doc,
    data.home_team.staff,
    data.away_team.staff,
    Math.max(home_final_y, away_final_y) + 3,
  );
}
