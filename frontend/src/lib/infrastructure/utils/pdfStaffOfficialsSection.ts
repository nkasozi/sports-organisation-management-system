import { jsPDF } from "jspdf";
import type {
  MatchReportData,
  MatchStaffEntry,
  MatchOfficialInfo,
} from "$lib/core/types/MatchReportTypes";
import {
  FONT_SIZE_SMALL,
  MARGIN_LEFT,
  PAGE_WIDTH,
  HALF_WIDTH,
} from "./pdfConstantsAndHelpers";

export function draw_team_staff_rows(
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

export function draw_officials_section(
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

    draw_official_row(
      doc,
      left_official,
      right_official,
      y,
      row_height,
      label_width,
      value_width,
    );
    y += row_height;
  }

  return y + 3;
}

function draw_official_row(
  doc: jsPDF,
  left_official: MatchOfficialInfo | undefined,
  right_official: MatchOfficialInfo | undefined,
  y: number,
  row_height: number,
  label_width: number,
  value_width: number,
): boolean {
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

  return true;
}
