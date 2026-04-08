import { describe, expect, it } from "vitest";

import { NEUTRAL_COLOR_PALETTES } from "./themeColorPalettesNeutral";

describe("themeColorPalettesNeutral", () => {
  it("defines the neutral palettes with expected keys and shade values", () => {
    expect(Object.keys(NEUTRAL_COLOR_PALETTES).sort()).toEqual([
      "cyan",
      "fuchsia",
      "lime",
      "sky",
      "slate",
    ]);
    expect(NEUTRAL_COLOR_PALETTES.sky[500]).toBe("#0ea5e9");
    expect(NEUTRAL_COLOR_PALETTES.slate[950]).toBe("#020617");
    expect(NEUTRAL_COLOR_PALETTES.fuchsia[100]).toBe("#fae8ff");
  });
});
