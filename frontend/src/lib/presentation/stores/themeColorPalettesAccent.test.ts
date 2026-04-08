import { describe, expect, it } from "vitest";

import { ACCENT_COLOR_PALETTES } from "./themeColorPalettesAccent";

describe("themeColorPalettesAccent", () => {
  it("defines the accent palettes with the expected key set and shades", () => {
    expect(Object.keys(ACCENT_COLOR_PALETTES).sort()).toEqual([
      "emerald",
      "indigo",
      "pink",
      "rose",
      "teal",
      "violet",
    ]);
    expect(ACCENT_COLOR_PALETTES.teal[500]).toBe("#14b8a6");
    expect(ACCENT_COLOR_PALETTES.rose[950]).toBe("#4c0519");
    expect(ACCENT_COLOR_PALETTES.violet[100]).toBe("#ede9fe");
  });
});
