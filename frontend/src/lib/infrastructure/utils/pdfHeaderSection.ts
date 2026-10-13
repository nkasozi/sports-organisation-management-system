import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";

import type { MatchReportData } from "$lib/core/types/MatchReportTypes";

import {
  FONT_SIZE_HEADER,
  FONT_SIZE_SMALL,
  FONT_SIZE_TITLE,
  type JsPDFWithAutoTable,
  LINE_HEIGHT,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
  truncate_text,
} from "./pdfConstantsAndHelpers";
import {
  HEADER_LOG_EVENT,
  HEADER_LOGO_FORMAT,
  HEADER_LOGO_SIZE,
  HEADER_TABLE_COLUMN_WIDTHS,
  HEADER_TABLE_HEADINGS,
  HEADER_TITLE_SUFFIX,
} from "./pdfHeaderConstants";

interface HeaderTitles {
  line_1: string;
  line_2: string;
  line_3: string;
}

const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

function build_header_titles(data: MatchReportData): HeaderTitles {
  return {
    line_1: `${data.league_name} ${data.fixture_year} ${HEADER_TITLE_SUFFIX}`,
    line_2: data.competition_name,
    line_3: data.report_title,
  };
}

function build_header_table_options(
  data: MatchReportData,
  y: number,
): UserOptions {
  return {
    startY: y,
    head: [[...HEADER_TABLE_HEADINGS]],
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
      lineColor: BLACK,
      lineWidth: 0.3,
      overflow: "ellipsize",
    },
    headStyles: { fillColor: WHITE, textColor: BLACK, fontStyle: "bold" },
    bodyStyles: { fillColor: WHITE, textColor: BLACK },
    columnStyles: Object.fromEntries(
      HEADER_TABLE_COLUMN_WIDTHS.map((cellWidth, index) => [
        index,
        { cellWidth },
      ]),
    ),
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
  };
}

export function draw_header_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  const titles = build_header_titles(data);
  const has_logo = Boolean(data.organization_logo_url);
  const title_end_y = has_logo
    ? draw_header_with_logo(doc, data, titles, y_start)
    : draw_header_without_logo(doc, titles, y_start);
  const table_y = title_end_y + 3;

  autoTable(doc, build_header_table_options(data, table_y));

  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? table_y + 20;
}

function draw_logo_titles(doc: jsPDF, titles: HeaderTitles, y: number): number {
  const text_x = MARGIN_LEFT + HEADER_LOGO_SIZE + 5;
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(titles.line_1, text_x, y + 2);
  doc.setFontSize(FONT_SIZE_HEADER);
  doc.text(titles.line_2, text_x, y + 7);
  doc.text(titles.line_3, text_x, y + 12);
  return y + 18;
}

function draw_header_with_logo(
  doc: jsPDF,
  data: MatchReportData,
  titles: HeaderTitles,
  y: number,
): number {
  try {
    doc.addImage(
      data.organization_logo_url,
      HEADER_LOGO_FORMAT,
      MARGIN_LEFT,
      y - 5,
      HEADER_LOGO_SIZE,
      HEADER_LOGO_SIZE,
    );
  } catch (error) {
    console.warn("[PDF] Logo could not be drawn, header rendered without it", {
      event: HEADER_LOG_EVENT.LOGO_DRAW_FAILED,
      report_title: data.report_title,
      error: String(error),
    });
    return draw_header_without_logo(doc, titles, y);
  }
  return draw_logo_titles(doc, titles, y);
}

function draw_header_without_logo(
  doc: jsPDF,
  titles: HeaderTitles,
  y_start: number,
): number {
  const center_x = PAGE_WIDTH / 2;
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(titles.line_1, center_x, y_start, { align: "center" });
  doc.setFontSize(FONT_SIZE_HEADER);
  doc.text(titles.line_2, center_x, y_start + LINE_HEIGHT, { align: "center" });
  doc.text(titles.line_3, center_x, y_start + LINE_HEIGHT * 2, {
    align: "center",
  });
  return y_start + LINE_HEIGHT * 3;
}
