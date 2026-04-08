import { describe, expect, expectTypeOf, it } from "vitest";

import {
  type ColorPalette,
  PALETTE_SHADES,
  type PaletteShade,
  type ThemeColorName,
  type ThemeConfig,
} from "./themeTypes";

describe("themeTypes", () => {
  it("defines the palette shades in ascending order for CSS variable generation", () => {
    expect(PALETTE_SHADES).toEqual([
      50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
    ]);
  });

  it("declares the exported theme types", () => {
    expectTypeOf<ColorPalette>().toEqualTypeOf<ColorPalette>();
    expectTypeOf<PaletteShade>().toEqualTypeOf<PaletteShade>();
    expectTypeOf<ThemeColorName>().toEqualTypeOf<ThemeColorName>();
    expectTypeOf<ThemeConfig>().toEqualTypeOf<ThemeConfig>();
  });
});
