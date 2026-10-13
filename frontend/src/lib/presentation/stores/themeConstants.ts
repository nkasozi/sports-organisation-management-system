import type { ThemeColorName, ThemeConfig } from "./themeTypes";

export const THEME_MODE = {
  LIGHT: "light",
  DARK: "dark",
} as const satisfies Record<string, ThemeConfig["mode"]>;

export const THEME_STORAGE_KEY = "sports-org-theme-v2";
export const PREFERS_DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const DARK_MODE_CLASS_NAME = "dark";
export const MEDIA_QUERY_CHANGE_EVENT = "change";

export const THEME_PALETTE_PREFIX = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
} as const;

export const FALLBACK_PRIMARY_COLOR: ThemeColorName = "blue";
export const FALLBACK_SECONDARY_COLOR: ThemeColorName = "red";

export const DEFAULT_THEME: ThemeConfig = {
  mode: THEME_MODE.DARK,
  primary_color: "red",
  secondary_color: "blue",
};

export const THEME_LOG_EVENTS = {
  PARSE_FAILED: "theme_parse_failed",
  SAVED: "theme_saved",
  SAVE_FAILED: "theme_save_failed",
} as const;

export const COLOR_NAME_MAP: Record<string, ThemeColorName> = {
  yellow: "sky",
  amber: "sky",
  blue: "blue",
  green: "green",
  red: "red",
  purple: "purple",
  orange: "cyan",
  teal: "teal",
  pink: "pink",
  indigo: "indigo",
  emerald: "emerald",
  cyan: "cyan",
  rose: "rose",
  violet: "violet",
  fuchsia: "fuchsia",
  lime: "lime",
  sky: "sky",
  slate: "slate",
};
