import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { MatchReportData } from "$lib/core/types/MatchReportTypes";

import {
  draw_color_swatch,
  FONT_SIZE_HEADER,
  FONT_SIZE_SMALL,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
  truncate_text,
} from "./pdfConstantsAndHelpers";

export function draw_result_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 5;

  doc.setFontSize(FONT_SIZE_HEADER);
  doc.setFont("helvetica", "bold");
  doc.text("RESULT", PAGE_WIDTH / 2, y, { align: "center" });
  y += 5;

  const team_box_width = 50;
  const score_table_width = 55;
  const col_away_team = PAGE_WIDTH - MARGIN_RIGHT - team_box_width;

  const result_rows = build_result_rows(data);
  const team_box_y = y;

  draw_team_boxes(doc, data, team_box_y, team_box_width, col_away_team);
  draw_score_table(doc, result_rows, team_box_y, score_table_width);

  y = team_box_y + 30;
  draw_team_colors(doc, data, y, col_away_team);

  return y + 5;
}

function build_result_rows(data: MatchReportData): string[][] {
  const rows: string[][] = [];
  rows.push([
    "Final",
    data.final_score.home.toString(),
    data.final_score.away.toString(),
  ]);
  for (const period of data.score_by_period) {
    rows.push([
      period.period_name,
      period.home_score.toString(),
      period.away_score.toString(),
    ]);
  }
  return rows;
}

function draw_team_boxes(
  doc: jsPDF,
  data: MatchReportData,
  team_box_y: number,
  team_box_width: number,
  col_away_team: number,
): boolean {
  const team_box_height = 22;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");
  doc.rect(MARGIN_LEFT, team_box_y, team_box_width, team_box_height);
  doc.text("Team", MARGIN_LEFT + 2, team_box_y + 4);
  doc.text(
    data.home_team.initials ? `(${data.home_team.initials})` : "",
    MARGIN_LEFT + 2,
    team_box_y + 8,
  );
  doc.setFont("helvetica", "bold");
  const home_name = truncate_text(data.home_team.name.toUpperCase(), 20);
  doc.text(home_name, MARGIN_LEFT + 2, team_box_y + 14, {
    maxWidth: team_box_width - 4,
  });

  doc.setFont("helvetica", "normal");
  doc.rect(col_away_team, team_box_y, team_box_width, team_box_height);
  doc.text("Team", col_away_team + 2, team_box_y + 4);
  doc.text(
    data.away_team.initials ? `(${data.away_team.initials})` : "",
    col_away_team + 2,
    team_box_y + 8,
  );
  doc.setFont("helvetica", "bold");
  const away_name = truncate_text(data.away_team.name.toUpperCase(), 20);
  doc.text(away_name, col_away_team + 2, team_box_y + 14, {
    maxWidth: team_box_width - 4,
  });

  return true;
}

function draw_score_table(
  doc: jsPDF,
  result_rows: string[][],
  team_box_y: number,
  score_table_width: number,
): boolean {
  const score_table_x = (PAGE_WIDTH - score_table_width) / 2;

  autoTable(doc, {
    startY: team_box_y,
    body: result_rows,
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1.5,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
    },
    margin: { left: score_table_x },
    tableWidth: score_table_width,
  });

  return true;
}

function draw_team_colors(
  doc: jsPDF,
  data: MatchReportData,
  y: number,
  col_away_for_color: number,
): boolean {
  const swatch_width = 15;
  const swatch_height = 4;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");
  doc.text("TEAM COLOR:", MARGIN_LEFT, y);
  draw_color_swatch(
    doc,
    data.home_team.jersey_color,
    MARGIN_LEFT + 25,
    y,
    swatch_width,
    swatch_height,
  );

  doc.text("TEAM COLOR:", col_away_for_color, y);
  draw_color_swatch(
    doc,
    data.away_team.jersey_color,
    col_away_for_color + 25,
    y,
    swatch_width,
    swatch_height,
  );

  return true;
}
