import { describe, expect, it } from "vitest";

import { PRIMARY_COLOR_PALETTES } from "./themeColorPalettesPrimary";

describe("themeColorPalettesPrimary", () => {
  it("defines the six primary palettes with stable shade values", () => {
    expect(Object.keys(PRIMARY_COLOR_PALETTES).sort()).toEqual([
      "amber",
      "blue",
      "green",
      "orange",
      "purple",
      "red",
    ]);
    expect(PRIMARY_COLOR_PALETTES.blue[500]).toBe("#3b82f6");
    expect(PRIMARY_COLOR_PALETTES.red[950]).toBe("#450a0a");
    expect(PRIMARY_COLOR_PALETTES.orange[500]).toBe("#06b6d4");
  });
});
