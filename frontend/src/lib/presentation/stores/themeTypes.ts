export type ThemeColorName =
  | "amber"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "indigo"
  | "emerald"
  | "rose"
  | "violet"
  | "fuchsia"
  | "lime"
  | "sky"
  | "slate"
  | "cyan";

export interface ThemeConfig {
  mode: "light" | "dark";
  primary_color: ThemeColorName;
  secondary_color: ThemeColorName;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export type PaletteShade = keyof ColorPalette;

export const PALETTE_SHADES: PaletteShade[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];
