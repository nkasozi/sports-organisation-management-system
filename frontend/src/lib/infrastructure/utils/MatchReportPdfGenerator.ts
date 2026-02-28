import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  MatchReportData,
  MatchPlayerEntry,
  MatchGoalEntry,
  MatchOfficialInfo,
  MatchScoreByPeriod,
} from "$lib/core/types/MatchReportTypes";

const FONT_SIZE_TITLE = 12;
const FONT_SIZE_HEADER = 10;
const FONT_SIZE_BODY = 8;
const FONT_SIZE_SMALL = 7;
const LINE_HEIGHT = 5;
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const HALF_WIDTH = CONTENT_WIDTH / 2;

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export function generate_match_report_pdf(data: MatchReportData): jsPDF {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  let y_position = 15;

  y_position = draw_header_section(doc, data, y_position);
  y_position = draw_result_section(doc, data, y_position);
  y_position = draw_lineup_section(doc, data, y_position);
  y_position = draw_officials_section(doc, data, y_position);
  y_position = draw_goals_section(doc, data, y_position);
  draw_remarks_section(doc, data, y_position);

  return doc;
}

function draw_header_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start;

  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(data.league_name, PAGE_WIDTH / 2, y, { align: "center" });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADER);
  doc.text(data.report_title, PAGE_WIDTH / 2, y, { align: "center" });
  y += LINE_HEIGHT * 2;

  const header_data = [
    ["DATE", "GAME WK", "POOL", "MATCH No.", "SCHEDULED PUSH BACK", "PUSH BACK TIME"],
    [data.date, data.game_week.toString(), data.pool, data.match_number.toString(), data.scheduled_push_back, data.push_back_time],
  ];

  autoTable(doc, {
    startY: y,
    head: [header_data[0]],
    body: [header_data[1]],
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 2,
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
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
  });

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 20;
}

function draw_result_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 5;

  doc.setFontSize(FONT_SIZE_HEADER);
  doc.setFont("helvetica", "bold");
  doc.text("RESULT", PAGE_WIDTH / 2, y, { align: "center" });
  y += 3;

  const col_team = 45;
  const col_score_left = 95;
  const col_score_right = 115;
  const col_period = 75;
  const col_away_team = 135;

  doc.setFontSize(FONT_SIZE_BODY);
  doc.setFont("helvetica", "normal");
  doc.text("Team", MARGIN_LEFT, y + 5);
  doc.text(data.home_team.initials ? `(${data.home_team.initials})` : "", MARGIN_LEFT, y + 10);

  const result_rows: string[][] = [];
  for (const period of data.score_by_period) {
    result_rows.push([period.period_name, period.home_score.toString(), period.away_score.toString()]);
  }
  result_rows.unshift(["Final", data.final_score.home.toString(), data.final_score.away.toString()]);

  doc.text("Team", col_away_team, y + 5);
  doc.text(data.away_team.initials ? `(${data.away_team.initials})` : "", col_away_team + 30, y + 10);

  const team_box_y = y;
  doc.rect(MARGIN_LEFT, team_box_y, col_team - MARGIN_LEFT, 20);
  doc.text(data.home_team.name.toUpperCase(), MARGIN_LEFT + 2, team_box_y + 8, { maxWidth: col_team - MARGIN_LEFT - 4 });

  doc.rect(col_away_team, team_box_y, PAGE_WIDTH - MARGIN_RIGHT - col_away_team, 20);
  doc.text(data.away_team.name.toUpperCase(), col_away_team + 2, team_box_y + 8, { maxWidth: PAGE_WIDTH - MARGIN_RIGHT - col_away_team - 4 });

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
    margin: { left: col_period - 15, right: PAGE_WIDTH - col_score_right - 15 },
    tableWidth: 55,
  });

  y = team_box_y + 25;

  const home_color_y = y;
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.text("TEAM COLOR:", MARGIN_LEFT, home_color_y);
  doc.setFont("helvetica", "bold");
  doc.text(data.home_team.jersey_color.toUpperCase(), MARGIN_LEFT + 25, home_color_y);

  doc.setFont("helvetica", "normal");
  doc.text("TEAM COLOR:", col_away_team, home_color_y);
  doc.setFont("helvetica", "bold");
  doc.text(data.away_team.jersey_color.toUpperCase(), col_away_team + 25, home_color_y);

  return y + 5;
}

function draw_lineup_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 3;

  const home_table_data = build_player_table_data(data.home_players);
  const away_table_data = build_player_table_data(data.away_players);

  const headers = [["Time On", "Shirt No.", "Names", "", "", ""]];
  const header_widths = [10, 10, 40, 5, 5, 5];

  autoTable(doc, {
    startY: y,
    head: headers,
    body: home_table_data,
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
    columnStyles: {
      0: { cellWidth: header_widths[0], halign: "center" },
      1: { cellWidth: header_widths[1], halign: "center" },
      2: { cellWidth: header_widths[2], halign: "left" },
      3: { cellWidth: header_widths[3], halign: "center" },
      4: { cellWidth: header_widths[4], halign: "center" },
      5: { cellWidth: header_widths[5], halign: "center" },
    },
    margin: { left: MARGIN_LEFT, right: PAGE_WIDTH / 2 + 5 },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) => draw_card_indicators(doc, cell_data, data.home_players),
  });

  const home_final_y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;

  autoTable(doc, {
    startY: y,
    head: headers,
    body: away_table_data,
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
    columnStyles: {
      0: { cellWidth: header_widths[0], halign: "center" },
      1: { cellWidth: header_widths[1], halign: "center" },
      2: { cellWidth: header_widths[2], halign: "left" },
      3: { cellWidth: header_widths[3], halign: "center" },
      4: { cellWidth: header_widths[4], halign: "center" },
      5: { cellWidth: header_widths[5], halign: "center" },
    },
    margin: { left: PAGE_WIDTH / 2 + 5, right: MARGIN_RIGHT },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) => draw_card_indicators(doc, cell_data, data.away_players),
  });

  const away_final_y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;
  y = Math.max(home_final_y, away_final_y) + 3;

  y = draw_team_staff_row(doc, "Coach", data.home_team.coach, data.away_team.coach, y);
  y = draw_team_staff_row(doc, "TEAM MANAGER", data.home_team.team_manager, data.away_team.team_manager, y);
  y = draw_team_staff_row(doc, "ASST. COACH / OTHER", data.home_team.assistant_coach, data.away_team.assistant_coach, y);

  return y;
}

interface CellDrawData {
  section: string;
  column: { index: number };
  row: { index: number };
  cell: { x: number; y: number; width: number; height: number };
}

function draw_card_indicators(
  doc: jsPDF,
  cell_data: CellDrawData,
  players: MatchPlayerEntry[],
): void {
  if (cell_data.section !== "body") return;
  
  const row_index = cell_data.row.index;
  if (row_index >= players.length) return;
  
  const player = players[row_index];
  if (!player.cards || player.cards.length === 0) return;

  const green_col = 3;
  const yellow_col = 4;
  const red_col = 5;

  if (cell_data.column.index === yellow_col) {
    const yellow_card = player.cards.find((c) => c.card_type === "yellow");
    if (yellow_card) {
      const x = cell_data.cell.x + 1;
      const y_pos = cell_data.cell.y + 1;
      const w = cell_data.cell.width - 2;
      const h = cell_data.cell.height - 2;
      doc.setFillColor(255, 255, 0);
      doc.rect(x, y_pos, w, h, "F");
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      doc.text(yellow_card.minute, x + w / 2, y_pos + h / 2 + 1, { align: "center" });
      doc.setTextColor(0, 0, 0);
    }
  }

  if (cell_data.column.index === red_col) {
    const red_card = player.cards.find((c) => c.card_type === "red");
    if (red_card) {
      const x = cell_data.cell.x + 1;
      const y_pos = cell_data.cell.y + 1;
      const w = cell_data.cell.width - 2;
      const h = cell_data.cell.height - 2;
      doc.setFillColor(255, 0, 0);
      doc.rect(x, y_pos, w, h, "F");
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text(red_card.minute, x + w / 2, y_pos + h / 2 + 1, { align: "center" });
      doc.setTextColor(0, 0, 0);
    }
  }
}

function build_player_table_data(players: MatchPlayerEntry[]): string[][] {
  const rows: string[][] = [];
  
  for (const player of players) {
    rows.push([
      player.time_on,
      player.jersey_number.toString(),
      player.name,
      "",
      "",
      "",
    ]);
  }

  while (rows.length < 18) {
    rows.push(["", "", "", "", "", ""]);
  }

  return rows;
}

function draw_team_staff_row(
  doc: jsPDF,
  label: string,
  home_value: string,
  away_value: string,
  y: number,
): number {
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "bold");
  
  const row_height = 5;
  const label_width = 35;
  const value_width = HALF_WIDTH - label_width - 5;

  doc.rect(MARGIN_LEFT, y, label_width, row_height);
  doc.rect(MARGIN_LEFT + label_width, y, value_width, row_height);
  doc.rect(PAGE_WIDTH / 2 + 5, y, label_width, row_height);
  doc.rect(PAGE_WIDTH / 2 + 5 + label_width, y, value_width, row_height);

  doc.text(label, MARGIN_LEFT + 2, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.text(home_value.toUpperCase(), MARGIN_LEFT + label_width + 2, y + 3.5);
  doc.setFont("helvetica", "bold");
  doc.text(label === "Coach" ? "Coach" : label, PAGE_WIDTH / 2 + 7, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.text(away_value.toUpperCase(), PAGE_WIDTH / 2 + 5 + label_width + 2, y + 3.5);

  return y + row_height;
}

function draw_officials_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 3;

  const left_officials = data.officials.filter((o) =>
    ["Umpire", "Judge", "Technical Officer", "Referee", "Fourth Official"].includes(o.role),
  );
  const right_officials = data.officials.filter((o) =>
    ["Reserve Umpire", "Assistant Referee 1", "Assistant Referee 2", "VAR"].includes(o.role),
  );

  const row_height = 5;
  const label_width = 35;
  const value_width = HALF_WIDTH - label_width - 5;

  for (const official of left_officials) {
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setFont("helvetica", "bold");
    doc.rect(MARGIN_LEFT, y, label_width, row_height);
    doc.rect(MARGIN_LEFT + label_width, y, value_width, row_height);
    doc.text(official.role.toUpperCase(), MARGIN_LEFT + 2, y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(official.name.toUpperCase(), MARGIN_LEFT + label_width + 2, y + 3.5);
    y += row_height;
  }

  let right_y = y_start + 3;
  for (const official of right_officials) {
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setFont("helvetica", "bold");
    doc.rect(PAGE_WIDTH / 2 + 5, right_y, label_width, row_height);
    doc.rect(PAGE_WIDTH / 2 + 5 + label_width, right_y, value_width, row_height);
    doc.text(official.role.toUpperCase(), PAGE_WIDTH / 2 + 7, right_y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(official.name.toUpperCase(), PAGE_WIDTH / 2 + 5 + label_width + 2, right_y + 3.5);
    right_y += row_height;
  }

  return Math.max(y, right_y) + 3;
}

function draw_goals_section(
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

  if (left_goals.length > 0) {
    const left_data = left_goals.map((g, idx) => [
      g.team_initials,
      g.minute.toString(),
      g.jersey_number.toString(),
      g.action,
      g.score,
    ]);

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
  }

  if (right_goals.length > 0) {
    const right_data = right_goals.map((g, idx) => [
      g.team_initials,
      g.minute.toString(),
      g.jersey_number.toString(),
      g.action,
      g.score,
    ]);

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
  }

  const left_final_y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y;
  return left_final_y + 3;
}

function draw_remarks_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): void {
  const y = y_start + 2;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "bold");
  doc.text("REMARKS", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");

  const legend_text = "FG - Field Goal / PC - Penalty Corner / PS - Penalty Stroke";
  doc.text(legend_text, MARGIN_LEFT + 30, y);
}

export function download_match_report(data: MatchReportData, filename?: string): void {
  const doc = generate_match_report_pdf(data);
  const safe_filename = filename || `Match_Report_${data.home_team.name}_vs_${data.away_team.name}.pdf`;
  doc.save(safe_filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_"));
}
