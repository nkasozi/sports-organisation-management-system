import type { ColorPalette } from "./themeTypes";

type ColorPaletteShades = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export function create_color_palette(shades: ColorPaletteShades): ColorPalette {
  return {
    50: shades[0],
    100: shades[1],
    200: shades[2],
    300: shades[3],
    400: shades[4],
    500: shades[5],
    600: shades[6],
    700: shades[7],
    800: shades[8],
    900: shades[9],
    950: shades[10],
  };
}
