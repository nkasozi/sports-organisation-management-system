import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  MatchReportData,
  MatchPlayerEntry,
  MatchGoalEntry,
  MatchOfficialInfo,
  MatchScoreByPeriod,
  MatchStaffEntry,
  CardTypeConfig,
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
  let y_position = 10;

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

  const title_line_1 = `${data.league_name} ${data.fixture_year} TECHNICAL REPORT`;
  const title_line_2 = data.competition_name;
  const title_line_3 = data.report_title;

  if (data.organization_logo_url && data.organization_logo_url.length > 0) {
    try {
      const logo_size = 15;
      doc.addImage(
        data.organization_logo_url,
        "PNG",
        MARGIN_LEFT,
        y - 5,
        logo_size,
        logo_size,
      );
      doc.setFontSize(FONT_SIZE_TITLE);
      doc.setFont("helvetica", "bold");
      doc.text(title_line_1, MARGIN_LEFT + logo_size + 5, y + 2);
      doc.setFontSize(FONT_SIZE_HEADER);
      doc.text(title_line_2, MARGIN_LEFT + logo_size + 5, y + 7);
      doc.text(title_line_3, MARGIN_LEFT + logo_size + 5, y + 12);
      y += 18;
    } catch {
      doc.setFontSize(FONT_SIZE_TITLE);
      doc.setFont("helvetica", "bold");
      doc.text(title_line_1, PAGE_WIDTH / 2, y, { align: "center" });
      y += LINE_HEIGHT;
      doc.setFontSize(FONT_SIZE_HEADER);
      doc.text(title_line_2, PAGE_WIDTH / 2, y, { align: "center" });
      y += LINE_HEIGHT;
      doc.text(title_line_3, PAGE_WIDTH / 2, y, { align: "center" });
      y += LINE_HEIGHT;
    }
  } else {
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.setFont("helvetica", "bold");
    doc.text(title_line_1, PAGE_WIDTH / 2, y, { align: "center" });
    y += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_HEADER);
    doc.text(title_line_2, PAGE_WIDTH / 2, y, { align: "center" });
    y += LINE_HEIGHT;
    doc.text(title_line_3, PAGE_WIDTH / 2, y, { align: "center" });
    y += LINE_HEIGHT;
  }

  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "DATE",
        "GAME WK",
        "POOL",
        "MATCH No.",
        "SCHEDULED PUSH BACK",
        "PUSH BACK TIME",
      ],
    ],
    body: [
      [
        data.date,
        data.game_week.toString(),
        truncate_text(data.pool, 12),
        data.match_number.toString(),
        data.scheduled_push_back,
        data.push_back_time,
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: FONT_SIZE_SMALL,
      cellPadding: 2,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      overflow: "ellipsize",
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
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22 },
      4: { cellWidth: 42 },
      5: { cellWidth: 42 },
    },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
  });

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 20;
}

function truncate_text(text: string, max_length: number): string {
  if (text.length <= max_length) return text;
  return text.substring(0, max_length - 2) + "..";
}

function parse_hex_color(hex: string): { r: number; g: number; b: number } {
  const clean_hex = hex.replace(/^#/, "");
  const r = parseInt(clean_hex.substring(0, 2), 16) || 128;
  const g = parseInt(clean_hex.substring(2, 4), 16) || 128;
  const b = parseInt(clean_hex.substring(4, 6), 16) || 128;
  return { r, g, b };
}

function draw_color_swatch(
  doc: jsPDF,
  hex_color: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const { r, g, b } = parse_hex_color(hex_color);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(0, 0, 0);
  doc.rect(x, y - height + 1, width, height, "FD");
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
  y += 5;

  const team_box_width = 50;
  const score_table_width = 55;
  const col_away_team = PAGE_WIDTH - MARGIN_RIGHT - team_box_width;

  const result_rows: string[][] = [];
  result_rows.push([
    "Final",
    data.final_score.home.toString(),
    data.final_score.away.toString(),
  ]);
  for (const period of data.score_by_period) {
    result_rows.push([
      period.period_name,
      period.home_score.toString(),
      period.away_score.toString(),
    ]);
  }

  const team_box_y = y;
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

  y = team_box_y + 30;

  const home_color_y = y;
  const team_box_width_for_color = 50;
  const col_away_for_color =
    PAGE_WIDTH - MARGIN_RIGHT - team_box_width_for_color;
  const swatch_width = 15;
  const swatch_height = 4;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");
  doc.text("TEAM COLOR:", MARGIN_LEFT, home_color_y);
  draw_color_swatch(
    doc,
    data.home_team.jersey_color,
    MARGIN_LEFT + 25,
    home_color_y,
    swatch_width,
    swatch_height,
  );

  doc.text("TEAM COLOR:", col_away_for_color, home_color_y);
  draw_color_swatch(
    doc,
    data.away_team.jersey_color,
    col_away_for_color + 25,
    home_color_y,
    swatch_width,
    swatch_height,
  );

  return y + 5;
}

function draw_lineup_section(
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
    columnStyles,
    margin: { left: MARGIN_LEFT, right: PAGE_WIDTH / 2 + 5 },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) =>
      draw_card_indicators(doc, cell_data, data.home_players, card_types),
  });

  const home_final_y =
    (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;

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
    columnStyles,
    margin: { left: PAGE_WIDTH / 2 + 5, right: MARGIN_RIGHT },
    tableWidth: HALF_WIDTH - 5,
    didDrawCell: (cell_data) =>
      draw_card_indicators(doc, cell_data, data.away_players, card_types),
  });

  const away_final_y =
    (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y + 100;
  y = Math.max(home_final_y, away_final_y) + 3;

  y = draw_team_staff_rows(doc, data.home_team.staff, data.away_team.staff, y);

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
  card_types: CardTypeConfig[],
): void {
  if (cell_data.section !== "body") return;

  const row_index = cell_data.row.index;
  if (row_index >= players.length) return;

  const player = players[row_index];
  if (!player.cards || player.cards.length === 0) return;

  const base_columns = 3;
  const card_col_offset = cell_data.column.index - base_columns;

  if (card_col_offset < 0 || card_col_offset >= card_types.length) return;

  const card_config = card_types[card_col_offset];
  const player_card = player.cards.find((c) => c.card_type === card_config.id);

  if (player_card) {
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
  }
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
  doc.text(label, PAGE_WIDTH / 2 + 7, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    away_value.toUpperCase(),
    PAGE_WIDTH / 2 + 5 + label_width + 2,
    y + 3.5,
  );

  return y + row_height;
}

function draw_team_staff_rows(
  doc: jsPDF,
  home_staff: MatchStaffEntry[],
  away_staff: MatchStaffEntry[],
  y: number,
): number {
  const max_staff = Math.max(home_staff.length, away_staff.length, 1);

  for (let i = 0; i < max_staff; i++) {
    const home_entry = home_staff[i];
    const away_entry = away_staff[i];
    const home_role = home_entry?.role || "";
    const away_role = away_entry?.role || "";
    const home_name = home_entry?.name || "";
    const away_name = away_entry?.name || "";
    y = draw_team_staff_row(
      doc,
      home_role.toUpperCase(),
      home_name,
      away_name,
      y,
    );
  }

  return y;
}

function draw_officials_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start + 3;

  const officials = data.officials;
  const half_count = Math.ceil(officials.length / 2);
  const left_officials = officials.slice(0, half_count);
  const right_officials = officials.slice(half_count);

  const row_height = 5;
  const label_width = 35;
  const value_width = HALF_WIDTH - label_width - 5;

  const max_rows = Math.max(left_officials.length, right_officials.length, 1);

  for (let i = 0; i < max_rows; i++) {
    const left_official = left_officials[i];
    const right_official = right_officials[i];

    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setFont("helvetica", "bold");

    doc.rect(MARGIN_LEFT, y, label_width, row_height);
    doc.rect(MARGIN_LEFT + label_width, y, value_width, row_height);
    doc.rect(PAGE_WIDTH / 2 + 5, y, label_width, row_height);
    doc.rect(PAGE_WIDTH / 2 + 5 + label_width, y, value_width, row_height);

    if (left_official) {
      doc.text(left_official.role.toUpperCase(), MARGIN_LEFT + 2, y + 3.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        left_official.name.toUpperCase(),
        MARGIN_LEFT + label_width + 2,
        y + 3.5,
      );
    }

    doc.setFont("helvetica", "bold");
    if (right_official) {
      doc.text(right_official.role.toUpperCase(), PAGE_WIDTH / 2 + 7, y + 3.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        right_official.name.toUpperCase(),
        PAGE_WIDTH / 2 + 5 + label_width + 2,
        y + 3.5,
      );
    }

    y += row_height;
  }

  return y + 3;
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

  const legend_text =
    "FG - Field Goal / PC - Penalty Corner / PS - Penalty Stroke";
  doc.text(legend_text, MARGIN_LEFT + 30, y);
}

export function download_match_report(
  data: MatchReportData,
  filename?: string,
): void {
  const doc = generate_match_report_pdf(data);
  const safe_filename =
    filename ||
    `Match_Report_${data.home_team.name}_vs_${data.away_team.name}.pdf`;
  doc.save(safe_filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_"));
}
