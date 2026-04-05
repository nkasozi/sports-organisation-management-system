import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MatchReportData } from "$lib/core/types/MatchReportTypes";
import {
  FONT_SIZE_TITLE,
  FONT_SIZE_HEADER,
  FONT_SIZE_SMALL,
  LINE_HEIGHT,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAGE_WIDTH,
  truncate_text,
  type JsPDFWithAutoTable,
} from "./pdfConstantsAndHelpers";

export function draw_header_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): number {
  let y = y_start;

  const title_line_1 = `${data.league_name} ${data.fixture_year} TECHNICAL REPORT`;
  const title_line_2 = data.competition_name;
  const title_line_3 = data.report_title;

  if (data.organization_logo_url && data.organization_logo_url.length > 0) {
    y = draw_header_with_logo(
      doc,
      data,
      title_line_1,
      title_line_2,
      title_line_3,
      y,
    );
  } else {
    y = draw_header_without_logo(
      doc,
      title_line_1,
      title_line_2,
      title_line_3,
      y,
    );
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

function draw_header_with_logo(
  doc: jsPDF,
  data: MatchReportData,
  title_line_1: string,
  title_line_2: string,
  title_line_3: string,
  y: number,
): number {
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
    return y + 18;
  } catch {
    return draw_header_without_logo(
      doc,
      title_line_1,
      title_line_2,
      title_line_3,
      y,
    );
  }
}

function draw_header_without_logo(
  doc: jsPDF,
  title_line_1: string,
  title_line_2: string,
  title_line_3: string,
  y: number,
): number {
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(title_line_1, PAGE_WIDTH / 2, y, { align: "center" });
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_HEADER);
  doc.text(title_line_2, PAGE_WIDTH / 2, y, { align: "center" });
  y += LINE_HEIGHT;
  doc.text(title_line_3, PAGE_WIDTH / 2, y, { align: "center" });
  y += LINE_HEIGHT;
  return y;
}
