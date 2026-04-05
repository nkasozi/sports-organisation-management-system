import { jsPDF } from "jspdf";

export const FONT_SIZE_TITLE = 12;
export const FONT_SIZE_HEADER = 10;
export const FONT_SIZE_BODY = 8;
export const FONT_SIZE_SMALL = 7;
export const LINE_HEIGHT = 5;
export const MARGIN_LEFT = 10;
export const MARGIN_RIGHT = 10;
export const PAGE_WIDTH = 210;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
export const HALF_WIDTH = CONTENT_WIDTH / 2;

export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export function truncate_text(text: string, max_length: number): string {
  if (text.length <= max_length) return text;
  return text.substring(0, max_length - 2) + "..";
}

export function parse_hex_color(hex: string): {
  r: number;
  g: number;
  b: number;
} {
  const clean_hex = hex.replace(/^#/, "");
  const r = parseInt(clean_hex.substring(0, 2), 16) || 128;
  const g = parseInt(clean_hex.substring(2, 4), 16) || 128;
  const b = parseInt(clean_hex.substring(4, 6), 16) || 128;
  return { r, g, b };
}

export function draw_color_swatch(
  doc: jsPDF,
  hex_color: string,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  const { r, g, b } = parse_hex_color(hex_color);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(0, 0, 0);
  doc.rect(x, y - height + 1, width, height, "FD");
  return true;
}
