import { describe, expect, it } from "vitest";

import { COLOR_OPTIONS } from "./settingsPageOptions";

describe("COLOR_OPTIONS", () => {
  it("lists each colour value exactly once", () => {
    const colour_values = COLOR_OPTIONS.map((option) => option.value);

    expect(new Set(colour_values).size).toBe(colour_values.length);
  });

  it("keeps a single sky and cyan option", () => {
    expect(
      COLOR_OPTIONS.filter((option) =>
        ["sky", "cyan"].includes(option.value),
      ).map((option) => option.value),
    ).toEqual(["sky", "cyan"]);
  });
});
