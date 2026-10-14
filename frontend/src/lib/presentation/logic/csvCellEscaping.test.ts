import { describe, expect, it } from "vitest";

import { escape_csv_cell_value } from "./csvCellEscaping";

describe("escape_csv_cell_value", () => {
  it("always quotes the cell and doubles embedded quotes", () => {
    expect(escape_csv_cell_value('Lions "Senior", Kampala')).toBe(
      '"Lions ""Senior"", Kampala"',
    );
  });

  it("quotes cells containing line breaks", () => {
    expect(escape_csv_cell_value("line one\nline two")).toBe(
      '"line one\nline two"',
    );
  });

  it.each(["=SUM(A1:A2)", "+1", "-1", "@cmd", "\tvalue", "\rvalue"])(
    "neutralises the spreadsheet formula prefix in %j",
    (raw_value: string) => {
      expect(escape_csv_cell_value(raw_value)).toBe(`"'${raw_value}"`);
    },
  );

  it("leaves ordinary text untouched apart from quoting", () => {
    expect(escape_csv_cell_value("Kampala = City")).toBe('"Kampala = City"');
    expect(escape_csv_cell_value("")).toBe('""');
  });
});
