import type { ColorPalette } from "./themeTypes";

export function create_color_palette(
  shades: [
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
  ],
): ColorPalette {
  const [
    shade_50,
    shade_100,
    shade_200,
    shade_300,
    shade_400,
    shade_500,
    shade_600,
    shade_700,
    shade_800,
    shade_900,
    shade_950,
  ] = shades;
  return {
    50: shade_50,
    100: shade_100,
    200: shade_200,
    300: shade_300,
    400: shade_400,
    500: shade_500,
    600: shade_600,
    700: shade_700,
    800: shade_800,
    900: shade_900,
    950: shade_950,
  };
}
