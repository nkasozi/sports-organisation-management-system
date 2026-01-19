import { describe, expect, it } from "vitest";
import {
  COUNTRY_NAMES,
  build_country_select_options,
  get_country_names_sorted_unique,
  is_country_name,
} from "./countries";

describe("countries", () => {
  it("exposes a reasonably complete country list", () => {
    expect(COUNTRY_NAMES.length).toBeGreaterThan(150);
    expect(is_country_name("Uganda")).toBe(true);
    expect(is_country_name("United Kingdom")).toBe(true);
  });

  it("returns sorted unique country names", () => {
    const sorted_unique = get_country_names_sorted_unique([
      "Uganda",
      "  Uganda ",
      "Kenya",
    ]);
    expect(sorted_unique).toEqual(["Kenya", "Uganda"]);
  });

  it("builds select options with label=value", () => {
    const options = build_country_select_options(["Uganda", "Kenya"]);
    expect(options).toEqual([
      { value: "Kenya", label: "Kenya" },
      { value: "Uganda", label: "Uganda" },
    ]);
  });
});
