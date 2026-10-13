import { jsPDF } from "jspdf";

import type { MatchReportData } from "$lib/core/types/MatchReportTypes";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  MATCH_REPORT_FILENAME_EXTENSION,
  MATCH_REPORT_FILENAME_PREFIX,
  MATCH_REPORT_FILENAME_VERSUS,
  MATCH_REPORT_PDF_ERROR_MESSAGE,
  MATCH_REPORT_PDF_LOG_EVENT,
  REMARKS_HEADING,
  REMARKS_LEGEND,
  REPORT_START_Y,
  SAFE_FILENAME_REPLACEMENT,
  UNSAFE_FILENAME_CHARACTERS,
} from "./matchReportPdfConstants";
import {
  FONT_SIZE_SMALL,
  type JsPDFWithAutoTable,
  MARGIN_LEFT,
} from "./pdfConstantsAndHelpers";
import { draw_goals_section } from "./pdfGoalsSection";
import { draw_header_section } from "./pdfHeaderSection";
import { draw_lineup_section } from "./pdfLineupSection";
import { draw_result_section } from "./pdfResultSection";
import { draw_officials_section } from "./pdfStaffOfficialsSection";

function draw_remarks_section(doc: jsPDF, y_start: number): number {
  const y = y_start + 2;
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "bold");
  doc.text(REMARKS_HEADING, MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(REMARKS_LEGEND, MARGIN_LEFT + 30, y);
  return y;
}

function draw_single_report_on_doc(
  doc: JsPDFWithAutoTable,
  data: MatchReportData,
): number {
  const section_drawers = [
    draw_header_section,
    draw_result_section,
    draw_lineup_section,
    draw_officials_section,
    draw_goals_section,
  ];
  const y_position = section_drawers.reduce(
    (y, draw_section) => draw_section(doc, data, y),
    REPORT_START_Y,
  );
  return draw_remarks_section(doc, y_position);
}

function sanitize_filename(filename: string): string {
  return filename.replace(
    UNSAFE_FILENAME_CHARACTERS,
    SAFE_FILENAME_REPLACEMENT,
  );
}

function build_default_filename(data: MatchReportData): string {
  return `${MATCH_REPORT_FILENAME_PREFIX}${data.home_team.name}${MATCH_REPORT_FILENAME_VERSUS}${data.away_team.name}${MATCH_REPORT_FILENAME_EXTENSION}`;
}

function render_and_save(reports: MatchReportData[], filename: string): string {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  reports.forEach((report, index) => {
    if (index > 0) doc.addPage();
    draw_single_report_on_doc(doc, report);
  });
  const sanitized_filename = sanitize_filename(filename);
  doc.save(sanitized_filename);
  return sanitized_filename;
}

export function download_match_report(
  data: MatchReportData,
  filename?: string,
): Result<string> {
  try {
    const saved_filename = render_and_save(
      [data],
      filename || build_default_filename(data),
    );
    console.log("[PDF] Match report PDF saved", {
      event: MATCH_REPORT_PDF_LOG_EVENT.GENERATION_COMPLETED,
      filename: saved_filename,
    });
    return create_success_result(saved_filename);
  } catch (error) {
    console.error("[PDF] Error generating or saving PDF", {
      event: MATCH_REPORT_PDF_LOG_EVENT.GENERATION_FAILED,
      error: String(error),
    });
    return create_failure_result(
      MATCH_REPORT_PDF_ERROR_MESSAGE.SINGLE_REPORT_FAILED,
    );
  }
}

export function download_all_match_reports(
  reports: MatchReportData[],
  filename: string,
): Result<string> {
  try {
    const saved_filename = render_and_save(reports, filename);
    console.log("[PDF] All match reports PDF saved", {
      event: MATCH_REPORT_PDF_LOG_EVENT.ALL_REPORTS_GENERATION_COMPLETED,
      report_count: reports.length,
      filename: saved_filename,
    });
    return create_success_result(saved_filename);
  } catch (error) {
    console.error("[PDF] Error generating or saving all reports PDF", {
      event: MATCH_REPORT_PDF_LOG_EVENT.ALL_REPORTS_GENERATION_FAILED,
      report_count: reports.length,
      error: String(error),
    });
    return create_failure_result(
      MATCH_REPORT_PDF_ERROR_MESSAGE.ALL_REPORTS_FAILED,
    );
  }
}
