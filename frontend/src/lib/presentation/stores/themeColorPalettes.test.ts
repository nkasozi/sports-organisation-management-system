import { describe, expect, it } from "vitest";

import { COLOR_PALETTES } from "./themeColorPalettes";
import { ACCENT_COLOR_PALETTES } from "./themeColorPalettesAccent";
import { NEUTRAL_COLOR_PALETTES } from "./themeColorPalettesNeutral";
import { PRIMARY_COLOR_PALETTES } from "./themeColorPalettesPrimary";

describe("themeColorPalettes", () => {
  it("merges the primary, accent, and neutral palettes into one lookup", () => {
    expect(COLOR_PALETTES.blue).toEqual(PRIMARY_COLOR_PALETTES.blue);
    expect(COLOR_PALETTES.rose).toEqual(ACCENT_COLOR_PALETTES.rose);
    expect(COLOR_PALETTES.slate).toEqual(NEUTRAL_COLOR_PALETTES.slate);
    expect(Object.keys(COLOR_PALETTES).sort()).toEqual(
      [
        ...Object.keys(PRIMARY_COLOR_PALETTES),
        ...Object.keys(ACCENT_COLOR_PALETTES),
        ...Object.keys(NEUTRAL_COLOR_PALETTES),
      ].sort(),
    );
  });

  it("preserves the full 11-shade structure for each palette", () => {
    expect(COLOR_PALETTES.blue[50]).toBe("#eff6ff");
    expect(COLOR_PALETTES.rose[950]).toBe("#4c0519");
    expect(Object.keys(COLOR_PALETTES.cyan)).toEqual([
      "50",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ]);
  });
});
