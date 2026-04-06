import { jsPDF } from "jspdf";
import type { MatchReportData } from "$lib/core/types/MatchReportTypes";
import {
  FONT_SIZE_SMALL,
  MARGIN_LEFT,
  type JsPDFWithAutoTable,
} from "./pdfConstantsAndHelpers";
import { draw_header_section } from "./pdfHeaderSection";
import { draw_result_section } from "./pdfResultSection";
import { draw_lineup_section } from "./pdfLineupSection";
import { draw_officials_section } from "./pdfStaffOfficialsSection";
import { draw_goals_section } from "./pdfGoalsSection";

function generate_match_report_pdf(data: MatchReportData): jsPDF {
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

function draw_remarks_section(
  doc: jsPDF,
  data: MatchReportData,
  y_start: number,
): boolean {
  const y = y_start + 2;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "bold");
  doc.text("REMARKS", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");

  const legend_text =
    "FG - Field Goal / PC - Penalty Corner / PS - Penalty Stroke";
  doc.text(legend_text, MARGIN_LEFT + 30, y);
  return true;
}

export function download_match_report(
  data: MatchReportData,
  filename?: string,
): boolean {
  try {
    console.log("[PDF] Starting PDF generation...");
    const doc = generate_match_report_pdf(data);
    const safe_filename =
      filename ||
      `Match_Report_${data.home_team.name}_vs_${data.away_team.name}.pdf`;
    const sanitized_filename = safe_filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    console.log("[PDF] Saving PDF as:", sanitized_filename);
    doc.save(sanitized_filename);
    console.log("[PDF] PDF save completed");
    return true;
  } catch (error) {
    console.error("[PDF] Error generating or saving PDF", {
      event: "pdf_generation_failed",
      error: String(error),
    });
    return false;
  }
}

function draw_single_report_on_doc(
  doc: JsPDFWithAutoTable,
  data: MatchReportData,
): boolean {
  let y_position = 10;
  y_position = draw_header_section(doc, data, y_position);
  y_position = draw_result_section(doc, data, y_position);
  y_position = draw_lineup_section(doc, data, y_position);
  y_position = draw_officials_section(doc, data, y_position);
  y_position = draw_goals_section(doc, data, y_position);
  draw_remarks_section(doc, data, y_position);
  return true;
}

function generate_all_match_reports_pdf(reports: MatchReportData[]): jsPDF {
  const doc = new jsPDF() as JsPDFWithAutoTable;

  for (let i = 0; i < reports.length; i++) {
    if (i > 0) {
      doc.addPage();
    }
    draw_single_report_on_doc(doc, reports[i]);
  }

  return doc;
}

export function download_all_match_reports(
  reports: MatchReportData[],
  filename: string,
): boolean {
  try {
    console.log(
      "[PDF] Starting all reports PDF generation, count:",
      reports.length,
    );
    const doc = generate_all_match_reports_pdf(reports);
    const sanitized_filename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    console.log("[PDF] Saving all reports PDF as:", sanitized_filename);
    doc.save(sanitized_filename);
    console.log("[PDF] All reports PDF save completed");
    return true;
  } catch (error) {
    console.error("[PDF] Error generating or saving all reports PDF", {
      event: "pdf_all_reports_generation_failed",
      error: String(error),
    });
    return false;
  }
}
