import { describe, expect, it } from "vitest";

import {
  build_named_record_options,
  build_named_record_options_with_blank,
  build_numeric_select_options,
  keep_first_option_per_value,
  parse_numeric_select_value,
} from "./searchable_select_options";

describe("searchable_select_options", () => {
  const records = [
    { id: "org_1", name: "Kampala League" },
    { id: "org_2", name: "Entebbe Cup" },
  ];

  it("maps named records to options in their original order", () => {
    expect(build_named_record_options(records)).toEqual([
      { value: "org_1", label: "Kampala League" },
      { value: "org_2", label: "Entebbe Cup" },
    ]);
  });

  it("returns an empty list when there are no records", () => {
    expect(build_named_record_options([])).toEqual([]);
  });

  it("puts a selectable blank option first", () => {
    expect(build_named_record_options_with_blank("All Teams", records)).toEqual(
      [
        { value: "", label: "All Teams" },
        { value: "org_1", label: "Kampala League" },
        { value: "org_2", label: "Entebbe Cup" },
      ],
    );
  });

  it("keeps only the blank option when there are no records", () => {
    expect(build_named_record_options_with_blank("No Card", [])).toEqual([
      { value: "", label: "No Card" },
    ]);
  });

  it("stringifies numeric option values and keeps labels", () => {
    expect(
      build_numeric_select_options([
        { value: 600_000, label: "Every 10 minutes" },
        { value: 15, label: "15 minutes before" },
      ]),
    ).toEqual([
      { value: "600000", label: "Every 10 minutes" },
      { value: "15", label: "15 minutes before" },
    ]);
  });

  it("parses selected numeric values back to numbers", () => {
    expect(parse_numeric_select_value("600000")).toBe(600_000);
    expect(parse_numeric_select_value("0")).toBe(0);
    expect(parse_numeric_select_value("-5")).toBe(-5);
  });

  it("keeps the first option for each repeated value", () => {
    expect(
      keep_first_option_per_value([
        { value: "", label: "No Card" },
        { value: "card_2", label: "Yellow" },
        { value: "", label: "Untitled" },
        { value: "card_2", label: "Red" },
      ]),
    ).toEqual([
      { value: "", label: "No Card" },
      { value: "card_2", label: "Yellow" },
    ]);
  });
});
