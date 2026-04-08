import { ACCENT_COLOR_PALETTES } from "./themeColorPalettesAccent";
import { NEUTRAL_COLOR_PALETTES } from "./themeColorPalettesNeutral";
import { PRIMARY_COLOR_PALETTES } from "./themeColorPalettesPrimary";
import type { ColorPalette, ThemeColorName } from "./themeTypes";

export const COLOR_PALETTES: Record<ThemeColorName, ColorPalette> = {
  ...PRIMARY_COLOR_PALETTES,
  ...ACCENT_COLOR_PALETTES,
  ...NEUTRAL_COLOR_PALETTES,
};
