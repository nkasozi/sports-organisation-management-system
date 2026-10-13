import type { HeaderFooterStyle } from "$lib/presentation/stores/brandingTypes";

export {
  DARK_MODE_CLASS_NAME,
  THEME_MODE,
} from "$lib/presentation/stores/themeConstants";

export const HEADER_FOOTER_STYLE = {
  PATTERN: "pattern",
  SOLID_COLOR: "solid_color",
} as const satisfies Record<string, HeaderFooterStyle>;

export const THEME_TOGGLE_LABEL = {
  SWITCH_TO_DARK: "Toggle dark mode",
  SWITCH_TO_LIGHT: "Toggle light mode",
} as const;
