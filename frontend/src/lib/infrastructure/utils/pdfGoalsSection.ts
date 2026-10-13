import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  MatchGoalEntry,
  MatchReportData,
} from "$lib/core/types/MatchReportTypes";

import {
  FONT_SIZE_SMALL,
  HALF_WIDTH,
  type JsPDFWithAutoTable,
  MARGIN_LEFT,
  PAGE_WIDTH,
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

  const left_table_final_y = draw_goals_table(
    doc,
    left_goals,
    goal_headers,
    col_widths,
    { y, margin_left: MARGIN_LEFT },
  );

  const right_table_final_y = draw_goals_table(
    doc,
    right_goals,
    goal_headers,
    col_widths,
    { y, margin_left: PAGE_WIDTH / 2 + 5 },
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

const GOAL_TABLE_BLACK: [number, number, number] = [0, 0, 0];
const GOAL_TABLE_WHITE: [number, number, number] = [255, 255, 255];

function draw_goals_table(
  doc: jsPDF,
  goals: MatchGoalEntry[],
  goal_headers: string[][],
  col_widths: number[],
  table_position: { y: number; margin_left: number },
): number {
  const y = table_position.y;
  if (goals.length === 0) return y;

  autoTable(doc, {
    startY: y,
    head: goal_headers,
    body: build_goal_row_data(goals),
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 1,
      halign: "center",
      lineColor: GOAL_TABLE_BLACK,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: GOAL_TABLE_WHITE,
      textColor: GOAL_TABLE_BLACK,
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: GOAL_TABLE_WHITE, textColor: GOAL_TABLE_BLACK },
    columnStyles: Object.fromEntries(
      col_widths.slice(0, 5).map((cellWidth, index) => [index, { cellWidth }]),
    ),
    margin: { left: table_position.margin_left },
    tableWidth: HALF_WIDTH - 10,
  });

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y;
}
