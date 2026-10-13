import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MatchReportData } from "$lib/core/types/MatchReportTypes";

import { draw_lineup_section } from "./pdfLineupSection";
import type { CellDrawData } from "./pdfLineupTableData";

const mocks = vi.hoisted(() => ({
  auto_table: vi.fn(),
  draw_team_staff_rows: vi.fn(),
}));

vi.mock("jspdf-autotable", () => ({ default: mocks.auto_table }));
vi.mock("./pdfStaffOfficialsSection", () => ({
  draw_team_staff_rows: mocks.draw_team_staff_rows,
}));

type TableOptions = {
  startY: number;
  head: string[][];
  body: string[][];
  columnStyles: Record<string, { cellWidth: number; halign: string }>;
  margin: { left: number; right: number };
  tableWidth: number;
  didDrawCell: (cell: unknown) => boolean;
};

type MockFn = ReturnType<typeof vi.fn>;

type MockDoc = {
  lastAutoTable: { finalY: number };
  setFillColor: MockFn;
  rect: MockFn;
  setFontSize: MockFn;
  setTextColor: MockFn;
  text: MockFn;
};

function create_doc(): MockDoc {
  return {
    lastAutoTable: { finalY: 0 },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
  };
}

function create_report(): MatchReportData {
  return {
    card_types: [
      { id: "yellow", name: "Yellow", color: "#FFFF00", event_type: "yc" },
      { id: "red", name: "Red", color: "#000000", event_type: "rc" },
    ],
    home_players: [
      {
        time_on: "0",
        jersey_number: 7,
        name: "ANN",
        cards: [{ card_type: "red", minute: "12'" }],
      },
    ],
    away_players: [
      { time_on: "5", jersey_number: "9", name: "BOB", cards: [] },
    ],
    home_team: { staff: ["home"] },
    away_team: { staff: ["away"] },
  } as unknown as MatchReportData;
}

function table_call(index: number): TableOptions {
  return mocks.auto_table.mock.calls[index][1] as TableOptions;
}

function body_cell(row: number, column: number): CellDrawData {
  return {
    section: "body",
    row: { index: row },
    column: { index: column },
    cell: { x: 10, y: 20, width: 6, height: 5 },
  };
}

describe("draw_lineup_section", () => {
  let doc: ReturnType<typeof create_doc>;

  beforeEach(() => {
    mocks.auto_table.mockReset();
    mocks.draw_team_staff_rows.mockReset().mockReturnValue(222);
    doc = create_doc();
    mocks.auto_table.mockImplementation((_doc, options: TableOptions) => {
      doc.lastAutoTable.finalY = options.margin.left === 10 ? 150 : 140;
    });
  });

  it("draws home and away tables then the staff rows", () => {
    const result = draw_lineup_section(doc as never, create_report(), 40);

    expect(result).toBe(222);
    expect(mocks.draw_team_staff_rows).toHaveBeenCalledWith(
      doc,
      ["home"],
      ["away"],
      153,
    );
    expect(table_call(0)).toMatchObject({
      startY: 43,
      head: [["Time On", "Shirt No.", "Names", "Y", "R"]],
      margin: { left: 10, right: 110 },
      tableWidth: 90,
    });
    expect(table_call(1).margin).toEqual({ left: 110, right: 10 });
  });

  it("pads player rows to eighteen with empty card columns", () => {
    draw_lineup_section(doc as never, create_report(), 40);

    const body = table_call(0).body;
    expect(body).toHaveLength(18);
    expect(body[0]).toEqual(["0", "7", "ANN", "", ""]);
    expect(body[17]).toEqual(["", "", "", "", ""]);
    expect(table_call(1).body[0]).toEqual(["5", "9", "BOB", "", ""]);
  });

  it("left-aligns the names column only", () => {
    draw_lineup_section(doc as never, create_report(), 40);

    expect(table_call(0).columnStyles).toEqual({
      "0": { cellWidth: 10, halign: "center" },
      "1": { cellWidth: 10, halign: "center" },
      "2": { cellWidth: 40, halign: "left" },
      "3": { cellWidth: 5, halign: "center" },
      "4": { cellWidth: 5, halign: "center" },
    });
  });

  it("falls back to y + 100 when no table position is reported", () => {
    mocks.auto_table.mockImplementation(() => {});
    const doc_without_table = { ...create_doc(), lastAutoTable: undefined };

    draw_lineup_section(doc_without_table as never, create_report(), 0);

    expect(mocks.draw_team_staff_rows.mock.calls[0][3]).toBe(106);
  });

  it("paints card cells with contrasting minute text", () => {
    draw_lineup_section(doc as never, create_report(), 40);
    const draw_cell = table_call(0).didDrawCell;

    expect(draw_cell(body_cell(0, 4))).toBe(true);
    expect(doc.setFillColor).toHaveBeenCalledWith(128, 128, 128);
    expect(doc.rect).toHaveBeenCalledWith(10.5, 20.5, 5, 4, "F");
    expect(doc.setTextColor).toHaveBeenNthCalledWith(1, 255, 255, 255);
    expect(doc.text).toHaveBeenCalledWith("12'", 13, 23.5, { align: "center" });
    expect(doc.setTextColor).toHaveBeenLastCalledWith(0, 0, 0);
  });

  it("skips non-card, non-body and empty cells", () => {
    draw_lineup_section(doc as never, create_report(), 40);
    const draw_home = table_call(0).didDrawCell;
    const draw_away = table_call(1).didDrawCell;

    expect(draw_home({ ...body_cell(0, 4), section: "head" })).toBe(false);
    expect(draw_home(body_cell(5, 4))).toBe(false);
    expect(draw_home(body_cell(0, 2))).toBe(false);
    expect(draw_home(body_cell(0, 9))).toBe(false);
    expect(draw_home(body_cell(0, 3))).toBe(false);
    expect(draw_away(body_cell(0, 3))).toBe(false);
    expect(doc.rect).not.toHaveBeenCalled();
  });
});
