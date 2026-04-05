import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  MatchReportData,
  MatchPlayerEntry,
  CardTypeConfig,
} from "$lib/core/types/MatchReportTypes";
import {
  FONT_SIZE_SMALL,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
  HALF_WIDTH,
  parse_hex_color,
  type JsPDFWithAutoTable,
} from "./pdfConstantsAndHelpers";
import { draw_team_staff_rows } from "./pdfStaffOfficialsSection";

interface CellDrawData {
  section: string;
  column: { index: number };
  row: { index: number };
  cell: { x: number; y: number; width: number; height: number };
}

export function draw_lineup_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 3;

  const card_types = data.card_types || [];
  const card_col_width = 5;
  const base_headers = ["Time On", "Shirt No.", "Names"];
  const card_headers = card_types.map((ct) => ct.name.charAt(0));
  const headers = [[...base_headers, ...card_headers]];

  const base_header_widths = [10, 10, 40];
  const card_header_widths = card_types.map(() => card_col_width);
  const all_header_widths = [...base_header_widths, ...card_header_widths];

  const home_table_data = build_player_table_data(
    data.home_players,
    card_types.length,
  );
  const away_table_data = build_player_table_data(
    data.away_players,
    card_types.length,
  );

  const columnStyles = build_column_styles(all_header_widths);

  draw_lineup_table(
    doc,
    headers,
    home_table_data,
    columnStyles,
    y,
    data.home_players,
    card_types,
    MARGIN_LEFT,
    PAGE_WIDTH / 2 + 5,
  );
  const home_final_y =
    (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;

  draw_lineup_table(
    doc,
    headers,
    away_table_data,
    columnStyles,
    y,
    data.away_players,
    card_types,
    PAGE_WIDTH / 2 + 5,
    MARGIN_RIGHT,
  );
  const away_final_y =
    (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;

  y = Math.max(home_final_y, away_final_y) + 3;
  y = draw_team_staff_rows(doc, data.home_team.staff, data.away_team.staff, y);

  return y;
}

function build_column_styles(
  all_header_widths: number[],
): Record<string, { cellWidth: number; halign: "left" | "center" | "right" }> {
  const columnStyles: Record<
    string,
    { cellWidth: number; halign: "left" | "center" | "right" }
  > = {};
  all_header_widths.forEach((width, index) => {
    columnStyles[index.toString()] = {
      cellWidth: width,
      halign: index === 2 ? "left" : "center",
    };
  });
  return columnStyles;
}

function draw_lineup_table(
  doc: jsPDF,
  headers: string[][],
  table_data: string[][],
  columnStyles: Record<
    string,
    { cellWidth: number; halign: "left" | "center" | "right" }
  >,
  y: number,
  players: MatchPlayerEntry[],
  card_types: CardTypeConfig[],
  left_margin: number,
  right_margin: number,
): boolean {
  autoTable(doc, {
    startY: y,
    head: headers,
    body: table_data,
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 6,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    columnStyles,
    margin: { left: left_margin, right: right_margin },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) =>
      draw_card_indicators(doc, cell_data, players, card_types),
  });
  return true;
}

function draw_card_indicators(
  doc: jsPDF,
  cell_data: CellDrawData,
  players: MatchPlayerEntry[],
  card_types: CardTypeConfig[],
): boolean {
  if (cell_data.section !== "body") return false;

  const row_index = cell_data.row.index;
  if (row_index >= players.length) return false;

  const player = players[row_index];
  if (!player.cards || player.cards.length === 0) return false;

  const base_columns = 3;
  const card_col_offset = cell_data.column.index - base_columns;
  if (card_col_offset < 0 || card_col_offset >= card_types.length) return false;

  const card_config = card_types[card_col_offset];
  const player_card = player.cards.find((c) => c.card_type === card_config.id);
  if (!player_card) return false;

  const x = cell_data.cell.x + 0.5;
  const y_pos = cell_data.cell.y + 0.5;
  const w = cell_data.cell.width - 1;
  const h = cell_data.cell.height - 1;

  const { r, g, b } = parse_hex_color(card_config.color);
  doc.setFillColor(r, g, b);
  doc.rect(x, y_pos, w, h, "F");

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const text_color = brightness > 128 ? 0 : 255;

  doc.setFontSize(5);
  doc.setTextColor(text_color, text_color, text_color);
  doc.text(player_card.minute, x + w / 2, y_pos + h / 2 + 1, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  return true;
}

function build_player_table_data(
  players: MatchPlayerEntry[],
  card_count: number,
): string[][] {
  const rows: string[][] = [];

  for (const player of players) {
    const row = [player.time_on, player.jersey_number.toString(), player.name];
    for (let i = 0; i < card_count; i++) {
      row.push("");
    }
    rows.push(row);
  }

  const empty_row = ["", "", ""];
  for (let i = 0; i < card_count; i++) {
    empty_row.push("");
  }

  while (rows.length < 18) {
    rows.push([...empty_row]);
  }

  return rows;
}
