import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  MatchReportData,
  MatchGoalEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  FONT_SIZE_SMALL,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
  HALF_WIDTH,
  type JsPDFWithAutoTable,
} from "./pdfConstantsAndHelpers";

export function draw_goals_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 2;

  const half_goals = Math.ceil(data.goals.length / 2);
  const left_goals = data.goals.slice(0, half_goals);
  const right_goals = data.goals.slice(half_goals);

  const goal_headers = [["TEAM", "Minute", "No.", "Action", "Score"]];
  const col_widths = [15, 12, 10, 12, 15];

  const left_table_final_y = draw_left_goals_table(
    doc,
    left_goals,
    goal_headers,
    col_widths,
    y,
  );

  const right_table_final_y = draw_right_goals_table(
    doc,
    right_goals,
    goal_headers,
    col_widths,
    y,
  );

  return Math.max(left_table_final_y, right_table_final_y) + 3;
}

function build_goal_row_data(goals: MatchGoalEntry[]): string[][] {
  return goals.map((g) => [
    g.team_initials,
    g.minute.toString(),
    g.jersey_number.toString(),
    g.action,
    g.score,
  ]);
}

function draw_left_goals_table(
  doc: jsPDF,
  left_goals: MatchGoalEntry[],
  goal_headers: string[][],
  col_widths: number[],
  y: number,
): number {
  if (left_goals.length === 0) return y;

  const left_data = build_goal_row_data(left_goals);

  autoTable(doc, {
    startY: y,
    head: goal_headers,
    body: left_data,
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: col_widths[0] },
      1: { cellWidth: col_widths[1] },
      2: { cellWidth: col_widths[2] },
      3: { cellWidth: col_widths[3] },
      4: { cellWidth: col_widths[4] },
    },
    margin: { left: MARGIN_LEFT },
    tableWidth: HALF_WIDTH - 10,
  });

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y;
}

function draw_right_goals_table(
  doc: jsPDF,
  right_goals: MatchGoalEntry[],
  goal_headers: string[][],
  col_widths: number[],
  y: number,
): number {
  if (right_goals.length === 0) return y;

  const right_data = build_goal_row_data(right_goals);

  autoTable(doc, {
    startY: y,
    head: goal_headers,
    body: right_data,
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: col_widths[0] },
      1: { cellWidth: col_widths[1] },
      2: { cellWidth: col_widths[2] },
      3: { cellWidth: col_widths[3] },
      4: { cellWidth: col_widths[4] },
    },
    margin: { left: PAGE_WIDTH / 2 + 5 },
    tableWidth: HALF_WIDTH - 10,
  });

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y;
}
