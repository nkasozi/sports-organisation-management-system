import { describe, expect, it } from "vitest";
import {
  clamp_index,
  filter_select_options,
  find_select_option_by_value,
  normalize_select_query,
  type SelectOption,
} from "./searchable_select_logic";

describe("searchable_select_logic", () => {
  const options: SelectOption[] = [
    { value: "UG", label: "Uganda" },
    { value: "KE", label: "Kenya" },
    { value: "GB", label: "United Kingdom" },
  ];

  it("normalizes query", () => {
    expect(normalize_select_query("  Uganda ")).toBe("uganda");
  });

  it("filters by label or value", () => {
    expect(filter_select_options(options, "uni").map((o) => o.value)).toEqual([
      "GB",
    ]);
    expect(filter_select_options(options, "ug").map((o) => o.value)).toEqual([
      "UG",
    ]);
  });

  it("returns all options on empty query", () => {
    expect(filter_select_options(options, "").length).toBe(3);
  });

  it("finds option by exact value", () => {
    expect(find_select_option_by_value(options, "KE")?.label).toBe("Kenya");
    expect(find_select_option_by_value(options, "XX")).toBeNull();
  });

  it("clamps index", () => {
    expect(clamp_index(-1, 0, 2)).toBe(0);
    expect(clamp_index(3, 0, 2)).toBe(2);
    expect(clamp_index(1, 0, 2)).toBe(1);
  });
});
